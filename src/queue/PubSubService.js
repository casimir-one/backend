import { Singleton } from "@casimir/toolbox";
import PubSub from "pubsub-js";

export default class PubSubService extends Singleton {
  constructor() {
    super();
  }

  static getInstanceAsync() {
    return this;
  }

  async init() {
    return this;
  }


  async sendEvents(topic, events) {
    if (events.length) {
      return PubSub.publishSync(topic, events);
    }
  }


  async subscribeEach(groupId, topic, subF) {
    return PubSub.subscribe(topic, async (topic, events) => {
      for (const event of events) {
        await subF(topic, event);
      }
    });
  }
}
