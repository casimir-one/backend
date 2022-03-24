import BaseEventHandler from './../event-handlers/base/BaseEventHandler';
import { QUEUE_TOPIC } from './../constants';
import QueueService from "./QueueService";
import config from "../config";

// TODO: Use Apache Kafka consumer

var isBroadcasting = false;
const eventsBuffer = [];

QueueService.getInstanceAsync(config).then(async queueService => {
  await queueService.subscribeEach(QUEUE_TOPIC.APP_EVENT_TOPIC, async (topic, event) => {
    await BaseEventHandler.Broadcast([event]);
  })
})

// cron.schedule('*/0.5 * * * * *', async () => {

//   if (!isBroadcasting) {
//     isBroadcasting = true;
//     const eventsBatch = eventsBuffer.splice(0, eventsBuffer.length)
//     try { 
//       await BaseEventHandler.Broadcast(eventsBatch);
//     } catch (err) {
//       console.error("Broadcast error: ", err);
//     }
//     isBroadcasting = false;
//   }

// });