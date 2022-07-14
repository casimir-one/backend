import { ChainService } from '@deip/chain-service';
import { DOMAIN_EVENT, APP_EVENT } from '@casimir/platform-core';
import config from "../config";
import ChainDomainEventHandler from "../event-handlers/base/ChainDomainEventHandler";
import QueueService from "../queue/QueueService";
import { logError, logProcessManagerInfo, logWarn, logDebug } from "../utils/log";
import { waitChainBlockAsync } from "../utils/network";
import {APP_CMD_TO_BC_EVENT_PROCESSOR} from './AppCmdToBlockchainEvent';
import { redis } from './redis';
import { OffchainProcessManager } from "./OffchainProcessManager";

QueueService.getInstanceAsync(config).then(async queueService => {
  await queueService.subscribeEach(config.KAFKA_CHAIN_GROUP_ID, config.KAFKA_CHAIN_TOPIC, async (topic, event) => {
    await ChainDomainEventHandler.Broadcast([event]);
    await fire(event);
    await OffchainProcessManager.getInstanceAsync(config).then(pm => pm.processChainEvent(event))
  })
});

const handlers = new Map();  // observers
const cmdToSubId = (cmd) => JSON.stringify(cmd.getCmdPayload());

const subscribe = (subId, matchF, res, rej) => {
  if (handlers.has(subId)) {
    throw new Error(`Process manager handlers already contain ${subId} subscription`);
  }

  const expiredAt = Date.now() + config.CHAIN_BLOCK_INTERVAL_MILLIS * 8;

  handlers.set(subId, { matchF, res, rej, expiredAt });
}

const unsubscribe = (key) => {
  handlers.delete(key);
}

const fire = async (event) => {
  if (!handlers.size) return;

  for (const handler of handlers) {
    const [key, { matchF, res, rej, expiredAt }] = handler;
    try {
      const isExpired = Date.now() > expiredAt;
      const matchResult = await matchF(event);
      if (matchResult) {
        unsubscribe(key);
        await res(event);
      } else if (isExpired) {
        unsubscribe(key);
        logError("ProcessManager handler expired", key);
        rej(new Error("ProcessManager handler expired"));
      }
    } catch (err) {
      rej(err);
    }
  }
}

const waitForEvent = (subId, matchF) => new Promise(async (res, rej) => {
  if (config.QUEUE_SERVICE === "pubsub") {
    logProcessManagerInfo("ProcessManager is not connected to blockchain events, waiting for timeout");
    return waitChainBlockAsync(res);
  }
  if (config.QUEUE_SERVICE === "kafka") {
    return subscribe(subId, matchF, res, rej)
  }
})

const waitForCommand = (txInfo, chainService) => async (appCmd) => {
  const cmdName = appCmd.getCmdName();
  const cmdNum = appCmd.getCmdNum();
  const eventProcessors = APP_CMD_TO_BC_EVENT_PROCESSOR[cmdNum] || [];

  if (!eventProcessors || eventProcessors.length === 0) {
    logWarn(`Process manager, cmd ${cmdName}:${cmdNum} is not supported yet!`)
    return waitChainBlockAsync();
  }

  logProcessManagerInfo(`ProcessManager, cmd ${cmdName} waiting for event: ${eventProcessors.map(x => DOMAIN_EVENT[x.eventNum]).join(' or ')}`);

  const subId = cmdToSubId(appCmd);
  return waitForEvent(subId, async (event) => {
    for (const eventProcessor of eventProcessors) {

      const { eventNum, matchF } = eventProcessor;
      if (event.getEventNum() !== eventNum) return;

      const isMatched = matchF ? await matchF({ txInfo, appCmd, event, chainService }) : true;
      if (isMatched) {
        logProcessManagerInfo(`ProcessManager, cmd ${cmdName} matched success with event ${DOMAIN_EVENT[eventNum]}`);
        return event;
      }
    }
  });
}

const waitForBlockExtinsic = (txInfo, chainService) =>
  waitForEvent(txInfo, async (chainEvent) => {

    if (chainEvent.getEventNum() !== DOMAIN_EVENT.BLOCK_CREATED)
      return;

    const { hash } = chainEvent.getEventPayload();

    const chainRpc = chainService.getChainRpc();
    const chainNodeClient = chainService.getChainNodeClient();

    const block = await chainRpc.getBlockAsync(hash);

    //check if txInfo (txHash) is included in block extinsic hashes
    const extrinsicIndex = block.extrinsicHashes.indexOf(txInfo);
    if (extrinsicIndex === -1)
      return;

    //TODO: move to chainRpc
    const apiAt = await chainNodeClient.at(hash);
    const allRecords = await apiAt.query.system.events();

    const extrinsicFailedEventData = allRecords
      .find(({ phase, event: extrinsicEvent }) => phase.isApplyExtrinsic &&
        phase.asApplyExtrinsic.eq(extrinsicIndex) &&
        chainNodeClient.events.system.ExtrinsicFailed.is(extrinsicEvent)
      );

    // const BLOCK_EVENTS = allRecords
    //   .filter(({ phase }) =>
    //     phase.isApplyExtrinsic
    //     // phase.asApplyExtrinsic.eq(index)
    //   ).map(({ event }) => `${event.section}.${event.method}`);

    // console.log(`${section}.${method}:: ${BLOCK_EVENTS.join(', ') || 'no events'}`);

    console.log('extrinsicFailedEventData', extrinsicFailedEventData);
    if (extrinsicFailedEventData) {
      const { event: extrinsicFailedEvent } = extrinsicFailedEventData;

      const [dispatchError, dispatchInfo] = extrinsicFailedEvent;
      console.log("dispatchError", {
        dispatchError,
        dispatchInfo,
        dispatchInfoString: JSON.stringify(dispatchInfo),
        dispatchErrorString: JSON.stringify(dispatchError),
        isModule: dispatchError.isModule,
        asModule: dispatchError.asModule,
      });
      let errorInfo;
      // decode the error
      if (dispatchError.isModule) {
        // for module errors, we have the section indexed, lookup
        // (For specific known errors, we can also do a check against the
        // api.errors.<module>.<ErrorName>.is(dispatchError.asModule) guard)
        const decoded = chainNodeClient.registry.findMetaError(dispatchError.asModule);

        errorInfo = `${decoded.section}.${decoded.name}`;
      } else {
        // Other, CannotLookup, BadOrigin, no extra info
        errorInfo = dispatchError.toString();
      }
      throw new Error(`Tx failed: ${extrinsicFailedEvent.section}.${extrinsicFailedEvent.method}, ${errorInfo}`);
    }

    logProcessManagerInfo(`ProcessManager, tx executed success in block ${chainEvent.getEventPayload().number}`);
    return chainEvent;
  })




const toMetaKey = (key) => `batchMeta_${key}`;

const waitForCommands = async (txInfo, appCmds) => {
  const chainService = await ChainService.getInstanceAsync(config);

  const waitForBlock = waitForBlockExtinsic(txInfo, chainService);
  const waitForChainEvents = appCmds.map(waitForCommand(txInfo, chainService));

  const events = await Promise.all([waitForBlock, ...waitForChainEvents]);
  for (const event of events) event.setTxInfo(txInfo);

  // const maxEventIndex = events.reduce((max, event) => Math.max(max, event.getEventPayload().meta?.index || 0), 0);

  const cmdNumbers = appCmds.map(x => x.getCmdNum());
  redis.set(toMetaKey(txInfo), { maxEventIndex: null, cmdNumbers });

  return events;
};

const isChainEvent = (event) => {
  const domain = DOMAIN_EVENT[event.getEventNum()];
  const app = APP_EVENT[event.getEventNum()];
  return domain && !app;
};

const processBatch = (batch) => {
  // const chainEventsProducedFromCmd = cmdNumbers.map(n => APP_CMD_TO_BC_EVENT_PROCESSOR[n]?.map(x => x.eventNum));
  // const appEventsProducedFromCmd = cmdNumbers.map(n =>n); //TODO: here check what event we need

  const chainEvents = batch.filter(isChainEvent);
  const appEvents = batch.filter(x => !isChainEvent(x));
  for (const event of appEvents) {
    //TODO: think about better matching in case of multiple events with the same type. 1 chain event = 1 app event
    event.setAssociatedEvents(chainEvents);
  }
  return appEvents;
}

const isBatchFull = (meta, events) => {
  const { maxEventIndex, cmdNumbers } = meta;

  const blockEvent = events.find(x => x.getEventNum() === DOMAIN_EVENT.BLOCK_CREATED);
  if (!blockEvent) return false;


  const chainEvents = events.filter(x => isChainEvent(x) && x.getEventNum() !== DOMAIN_EVENT.BLOCK_CREATED);
  const appEvents = events.filter(x => !isChainEvent(x));

  // use process manager processors.length to support more than one event per cmd
  // each cmd should produce event so we can check if all events are produced
  const isFull = chainEvents.length === appEvents.length;
  console.log("IS BATCH FULL", {
    chainEvents, appEvents, isFull, cmdNumbers, maxEventIndex, lengths: {
      chainEvents: chainEvents.length,
      appEvents: appEvents.length,
    }
  });

  return isFull;
}

const batchProcessor = async (key, events) => {
  const meta = redis.get(toMetaKey(key))
  if (!meta) return;

  if (isBatchFull(meta, events)) {
    const processedBatch = processBatch(events);
    console.log("processedBatch", processedBatch);
    await QueueService.getInstanceAsync(config)
      .then(service => service.sendEvents(config.KAFKA_APP_TOPIC, processedBatch));

    cleanupEvents(key);
  }
}

const pushEventToProcessorAsync = async (txInfo, events) => {
  const { value: fullBatch } = redis.setArray(txInfo, events);
  await batchProcessor(txInfo, fullBatch);
}

const cleanupEvents = (key) => {
  console.log("cleanupEvents", key);
  redis.remove(key);
  redis.remove(toMetaKey(key));
}


const waitForWorkflow = async (workflow) => {
  await redisProxy.setWorkflow(workflow);
  await ProcessManager.on('WorkflowFinished', (workflow) => {

  })
  return events;
};


const blockProcessor = async (blockEvent) => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const chainRpc = chainService.getChainRpc();

  const { data: { number, hash }, meta: { domain_events } } = blockEvent.getEventPayload();

  //if block contains has no domain_events, skip 
  if (!domain_events) return;

  const chainBlock = chainNodeClient.getBlock(number);
  const blockExtrinsicHashes = chainBlock.extrinsicHashes;
  const extrinsicEvents = blockExtrinsicHashes.map(getExtrinsicEvents);

  for (let i = 0; i < blockExtrinsicHashes.length; i++) {
    const extrinsicHash = blockExtrinsicHashes[i];
    const events = extrinsicEvents[i];
    await redisProxy.setBlock();
  }
};

const getExtrinsicEvents = async (chainBlock) => {
  // const chainNodeClient = await ChainService.getInstanceAsync(config).then(x => x.chainNodeClient);
  // const extrinsicEvents = await chainNodeClient.getExtrinsicEvents(chainBlock);
  return [];
}



const redis_setBlock = async (chainBlock, extrinsicEvents) => {
  redis.set(`block_${chainBlock.meta.hash}`, { extrinsicHashes });
  // processWorkflow(workflow);
};

const redis_setWorkflow = async (txExtrinsicHash, workflow) => {
  redis.set(`workflow_${txExtrinsicHash}`, workflow);
}

const redis_setChainEvent = async (chainEvent) => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  const { meta: { hash: blockHash }, index } = chainEvent.getEventPayload();
  const block = await chainRpc.getBlockAsync(blockHash);
  const chainEventExtrinsicHash = block.extrinsicHashes[index];

  redis.setArray(`chainEvent_${chainEventExtrinsicHash}`, [chainEvent]);
};

const processWorkflow = (extrinsicHash) => {
  const stringWorkflow = redis.get(`workflow_${extrinsicHash}`);
  if (stringWorkflow) {
    const workflow = Workflow.decode(stringWorkflow);
    const chainEvents = redis.getChainEvents(`chainEvents_${extrinsicHash}`);

    const isValid = workflow.isValid(chainEvents);
  }
};



export const processManager = {
  cleanupEvents,
  pushEventToProcessorAsync,
  waitForCommands,
}
