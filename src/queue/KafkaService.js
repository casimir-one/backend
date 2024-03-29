import { assert, Singleton } from "@casimir.one/toolbox";
import { Kafka } from "kafkajs";
import { parseChainEvent } from "../events/base/ChainEvent";
import { logError, logInfo } from "../utils/log";
import { rebuildEvent } from './../events/rebuilder';


export default class KafkaService extends Singleton {
  producer;
  consumer;
  kafka;

  constructor(config) {
    super();
    assert(!!config.KAFKA_CLIENT_ID, `Kafka connection param is missed, KAFKA_CLIENT_ID`);
    assert(!!config.KAFKA_BROKER_URLS, `Kafka connection param is missed, KAFKA_BROKER_URLS`);

    this.clientId = config.KAFKA_CLIENT_ID;
    this.brokers = [...config.KAFKA_BROKER_URLS];
    // assert(!!config.KAFKA_USER, `Kafka auth param is missed, KAFKA_USER`);
    // assert(!!config.KAFKA_PASSWORD, `Kafka auth param is missed, KAFKA_PASSWORD`);
  }

  static getInstanceAsync() {
    const kafkaService = KafkaService.getInstance();
    return kafkaService.init();
  }

  async init() {
    this.kafka = new Kafka({
      clientId: this.clientId,
      brokers: this.brokers,
      connectionTimeout: 3000,
      // sasl: {
      //   mechanism: 'scram-sha-512',
      //   username: config.KAFKA_USER,
      //   password: config.KAFKA_PASSWORD
      // },
    });

    this.producer = this.kafka.producer();
    await this.producer.connect();

    return this;
  }


  async sendEvents(topic, events) {
    if (events.length) {
      const messages = events.map(e => ({ value: e.toString() }))
      await this.producer.send({ topic, messages })
        .catch(err => {
          logError("KafkaService sendEvents", err);
        }).finally(() => {
          const bytes = Buffer.byteLength(JSON.stringify(messages));
          logInfo("KafkaService sendEvent buffer size is ", {
            bytes,
            kiloBytes: bytes / 1024,
          })
        })
    }
  }


  parseChainEvent = (rawEvent) =>
    rawEvent.type && parseChainEvent(rawEvent);


  processMessage(message) {
    const rawEvent = JSON.parse(message.value.toString());

    return [
      rebuildEvent,
      this.parseChainEvent
    ].map(parseF => parseF(rawEvent)).filter(Boolean).find(Boolean);
  }

  async subscribeEach(groupId, topic, subF) {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.subscribe({ topic })
    return consumer.run({
      eachMessage: async ({ partition, message }) => {
        const parsedEvent = this.processMessage(message);
        if (parsedEvent) {
          return subF(topic, parsedEvent);
        }
      }
    })
  }
}
