import { Singleton } from '@casimir/toolbox';
import KafkaService from "./KafkaService";
import PubSubService from "./PubSubService";

export default class QueueService extends Singleton {
  constructor(config) {
    super();
    let impl;

    switch ( config.QUEUE_SERVICE ) {
      case "kafka": {
        impl = KafkaService.getInstance(config);
        break;
      }
      case 'pubsub': {
        impl = PubSubService.getInstance(config);
        break;
      }
      default: {
        throw new Error(`Unknown queue service ${config.QUEUE_SERVICE}. Possible values: kafka | pubsub`);
      }
    }

    return impl;
  }

  static getInstanceAsync(config) {
    const queueService = QueueService.getInstance(config);
    return queueService.init();
  }

  init() {
    return this.impl.init();
  }
}
