import PortalAppEventHandler from './../event-handlers/base/PortalAppEventHandler';
import { QUEUE_TOPIC } from './../constants';
import QueueService from "./QueueService";
import config from "../config";

QueueService.getInstanceAsync(config).then(async queueService => {
  await queueService.subscribeEach(config.KAFKA_APP_GROUP_ID, QUEUE_TOPIC.APP_EVENT, async (topic, event) => {
    await PortalAppEventHandler.Broadcast([event]);
  })
});
