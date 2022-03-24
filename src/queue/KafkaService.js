import { Singleton } from "@deip/toolbox";
import { assert } from "@deip/toolbox/lib/validation";
import { Kafka } from "kafkajs";
import config from "../config";
import BaseEvent from '../events/base/BaseEvent';
import { logError, logWarn } from "../utils/log";


const toTopicName = (name) => `topic-${name}`;
export default class KafkaService extends Singleton {
  producer;
  consumer;
  kafka;

  constructor() {
    super();
    assert(!!config.KAFKA_CLIENT_ID, `Kafka connection param is missed, KAFKA_CLIENT_ID`);
    assert(!!config.KAFKA_BROKER_URL, `Kafka connection param is missed, KAFKA_BROKER_URL`);
    assert(!!config.KAFKA_USER, `Kafka auth param is missed, KAFKA_USER`);
    assert(!!config.KAFKA_PASSWORD, `Kafka auth param is missed, KAFKA_PASSWORD`);
  }

  static getInstanceAsync() {
    const kafkaService = KafkaService.getInstance();
    return kafkaService.init();
  }

  async init() {
    this.kafka = new Kafka({
      clientId: config.KAFKA_CLIENT_ID,
      brokers: [config.KAFKA_BROKER_URL],
      connectionTimeout: 3000,
      sasl: {
        mechanism: 'scram-sha-512',
        username: config.KAFKA_USER,
        password: config.KAFKA_PASSWORD
      },
    });

    this.producer = this.kafka.producer();
    await this.producer.connect();

    this.consumer = this.kafka.consumer({ groupId: 'events' });
    await this.consumer.connect();

    return this;
  }


  async sendEvents(topic, events) {
    if (events.length) {
      const messages = events.map(e => ({ value: e.toString() }))
      await this.producer.send({ topic: toTopicName(topic), messages })
        .catch(err => {
          logError("KafkaService sendEvents", err);
        })
    }
  }

  processMessage(message) {
    const rawEvent = JSON.parse(message.value.toString());
    if (!rawEvent.eventNum)
      logWarn("KafkaService processMessage bad input, no eventNum", rawEvent)
    else return new BaseEvent(rawEvent.eventNum, rawEvent.eventPayload);
  }

  async subscribeEach(topic, subF) {
    await this.consumer.subscribe({ topic: toTopicName(topic), fromBeginning: true })
    return this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const parsedEvent = this.processMessage(message);
        if (parsedEvent) {
          return subF(topic, parsedEvent);
        }
      }
    })
  }
}