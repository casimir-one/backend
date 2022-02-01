import { Singleton } from '@deip/toolbox';
import KafkaService from "./KafkaService";
import PubSubService from "./PubSubService";


export default class QueueService extends Singleton {
  constructor({ QUEUE_SERVICE }) {
    super();
    let impl;
    switch ( QUEUE_SERVICE ) {
      case "kafka": {
        impl = KafkaService.getInstance({});
        break;
      }
      case 'pubsub': {
        impl = PubSubService.getInstance({});
        break;
      }
      default: {
        throw new Error(`Unknown queue service ${QUEUE_SERVICE}. Possible values: kafka | pubsub`);
      }
    }

    return impl;
  }

  static getInstanceAsync({ QUEUE_SERVICE }) {
    const queueService = QueueService.getInstance({ QUEUE_SERVICE });
    return queueService.init();
  }

  init() {
    return this.impl.init();
  }
}