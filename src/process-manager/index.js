import config from "../config";
import { QUEUE_TOPIC } from "../constants";
import ChainDomainEventHandler from "../event-handlers/base/ChainDomainEventHandler";
import QueueService from "../queue/QueueService";
import { logInfo, logWarn } from "../utils/log";
import { waitChainBlockAsync } from "../utils/network";
import APP_CMD_TO_BC_EVENT_PROCESSOR from './AppCmdToBlockchainEvent';
import { logError } from "../utils/log";


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
      if (matchF(event)) {
        unsubscribe(key);
        await res(event);
      } else if (isExpired) {
        unsubscribe(key);
        logError("Process manager handler expired");
        rej(new Error("Process manager handler expired"));
      }
    } catch (err) {
      rej(err);
    }
  }
}

const waitForEvent = (appCmd, matchF) => new Promise(async (res, rej) => {
  if (config.QUEUE_SERVICE === "pubsub") {
    console.log("Process manager is not connected to blockchain events, waiting for timeout");
    return waitChainBlockAsync(res);
  }
  if (config.QUEUE_SERVICE === "kafka") {
    const subId = getCmdHash(appCmd);
    return subscribe(subId, matchF, res, rej)
  }
})

const waitForCommand = (txInfo) => async (appCmd) => {
  const cmdName = appCmd.getCmdName();
  const cmdNum = appCmd.getCmdNum();
  const eventProcessors = APP_CMD_TO_BC_EVENT_PROCESSOR[cmdNum] || [];

  if (!eventProcessors || eventProcessors.length === 0) {
    logWarn(`Process manager, cmd ${cmdName}:${cmdNum} is not supported yet!`)
    return waitChainBlockAsync();
  }

  return waitForEvent(appCmd, (event) => {
    for (const eventProcessor of eventProcessors) {
      const { eventNum, matchF } = eventProcessor;

      if (event.getEventNum() === eventNum) {
        const isMatched = matchF ? matchF(txInfo, appCmd, event) : true;
        if (isMatched) {
          logInfo(`Process manager, event matched success`, { cmdName, eventNum })
          return event;
        }
      }
    }
  });
}

const waitForCommands = (txInfo, appCmds) => Promise.all(appCmds.map(waitForCommand(txInfo)));

export const processManager = {
  waitForCommands,
}
