import config from "../config";
import BaseEventHandler from "../event-handlers/base/BaseEventHandler";
import APP_CMD_TO_BC_EVENT_PROCESSOR from './AppCmdToBlockchainEvent';
import { QUEUE_TOPIC } from "../constants";
import { logError, logWarn } from "../utils/log";
import QueueService from "../queue/QueueService";
import { waitChainBlockAsync } from "../utils/network";


QueueService.getInstanceAsync(config).then(async queueService => {
  await queueService.subscribeEach(config.KAFKA_CHAIN_GROUP_ID, QUEUE_TOPIC.BLOCKCHAIN, async (topic, event) => {
    await BaseEventHandler.Broadcast([event]);
    await fire(event);
  })
});

const handlers = new Map();  // observers
const getCmdHash = (cmd) => JSON.stringify(cmd.getCmdPayload());

const subscribe = (subId, matchF, res, rej) => {
  if (handlers.has(subId)) {
    throw new Error("Process manager handler key duplication");
  }
  handlers.set(subId, { matchF, res, rej });
}
const unsubscribe = (key) => {
  handlers.delete(key);
}

const fire = async (event) => {
  if (!handlers.size) return;
  for (const handler of handlers) {
    const [key, { matchF, res, rej }] = handler;
    try {
      if (matchF(event)) {
        unsubscribe(key);
        await res(event);
      }
    } catch(err) {
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

const waitForCommand = async (txInfo, appCmd) => {
  const cmdName = appCmd.getCmdName();
  const cmdNum = appCmd.getCmdNum();
  const { eventNum, matchF } = APP_CMD_TO_BC_EVENT_PROCESSOR[cmdNum] || {};

  if (!eventNum) {
    logWarn(`Process manager, cmd ${cmdName}:${cmdNum} is not supported yet!`)
    return;
  }

  console.log(`Process manager, CMD - ${cmdName}:${cmdNum}, waiting for event ${eventNum}`);
  return waitForEvent(appCmd, (event) => {
    console.log(`Process manager is waiting for event: ${eventNum}, received event: ${event.getEventNum()}`);
    if (event.getEventNum() === eventNum) {
      const isMatched = matchF ? matchF(txInfo, appCmd, event) : true;
      if (isMatched) {
        console.log(`Process manager, event ${eventNum} matched success`)
        return event;
      }
    }
  });
}

const waitForCommands = async (txInfo, appCmds) => {
  for (const appCmd of appCmds) { //TODO: replace with promise all for events that contains data for more than one command
    await waitForCommand(txInfo, appCmd).catch(err => {
      logError("Process manager, waitForCommand error", err);
      throw err;
    })
  }
}

export const processManager = {
  waitForCommands,
}
