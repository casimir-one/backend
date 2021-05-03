import PubSub from 'pubsub-js';
import BaseEventHandler from './../event-handlers/base/BaseEventHandler';
import { QUEUE_TOPIC } from './../constants';


PubSub.subscribe(QUEUE_TOPIC.APP_EVENT_TOPIC, function (topic, events) {
  BaseEventHandler.Broadcast(events);
});