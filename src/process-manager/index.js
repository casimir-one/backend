import { ChainService } from '@deip/chain-service';
import { DOMAIN_EVENT } from '@deip/constants';
import config from "../config";
import { QUEUE_TOPIC } from "../constants";
import ChainDomainEventHandler from "../event-handlers/base/ChainDomainEventHandler";
import QueueService from "../queue/QueueService";
import { logError, logProcessManagerInfo, logWarn } from "../utils/log";
import { waitChainBlockAsync } from "../utils/network";
import APP_CMD_TO_BC_EVENT_PROCESSOR from './AppCmdToBlockchainEvent';


QueueService.getInstanceAsync(config).then(async queueService => {
  await queueService.subscribeEach(config.KAFKA_CHAIN_GROUP_ID, QUEUE_TOPIC.BLOCKCHAIN, async (topic, event) => {
    await ChainDomainEventHandler.Broadcast([event]);
    await fire(event);
  })
});

const handlers = new Map();  // observers
const getCmdHash = (cmd) => JSON.stringify(cmd.getCmdPayload());

const subscribe = (subId, matchF, res, rej) => {
  if (handlers.has(subId)) {
    throw new Error(`Process manager handlers already contain ${subId} subscription`);
  }

  const expiredAt = Date.now() + config.PROCESS_MANAGER_WAITING_FOR_MILLIS;

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

const waitForEvent = (appCmd, matchF) => new Promise(async (res, rej) => {
  if (config.QUEUE_SERVICE === "pubsub") {
    logProcessManagerInfo("ProcessManager is not connected to blockchain events, waiting for timeout");
    return waitChainBlockAsync(res);
  }
  if (config.QUEUE_SERVICE === "kafka") {
    const subId = getCmdHash(appCmd);
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

  return waitForEvent(appCmd, async (event) => {
    for (const eventProcessor of eventProcessors) {
      const { eventNum, matchF } = eventProcessor;

      if (event.getEventNum() === eventNum) {
        const isMatched = matchF ? await matchF({ txInfo, appCmd, event, chainService }) : true;
        if (isMatched) {
          logProcessManagerInfo(`ProcessManager, cmd ${cmdName} matched success with event ${DOMAIN_EVENT[eventNum]}`);
          return event;
        }
      }
    }
  });
}

const waitForCommands = async (txInfo, appCmds) => {
  const chainService = await ChainService.getInstanceAsync(config);

  return Promise.all(appCmds.map(waitForCommand(txInfo, chainService)));
};

export const processManager = {
  waitForCommands,
}
