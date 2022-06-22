import PortalAppEventHandler from './../event-handlers/base/PortalAppEventHandler';
import QueueService from "./QueueService";
import config from "../config";

QueueService.getInstanceAsync(config).then(async queueService => {
  await queueService.subscribeEach(config.KAFKA_APP_GROUP_ID, config.KAFKA_APP_TOPIC, async (topic, event) => {
    await PortalAppEventHandler.Broadcast([event]);
  })
});
