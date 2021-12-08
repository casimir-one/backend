import PubSub from 'pubsub-js';
import cron from 'node-cron';
import BaseEventHandler from './../event-handlers/base/BaseEventHandler';
import { QUEUE_TOPIC } from './../constants';

// TODO: Use Apache Kafka consumer

var isBroadcasting = false;
const eventsBuffer = [];

PubSub.subscribe(QUEUE_TOPIC.APP_EVENT_TOPIC, async function (topic, events) {
  // eventsBuffer.push(...events);
  await BaseEventHandler.Broadcast(events);
});

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