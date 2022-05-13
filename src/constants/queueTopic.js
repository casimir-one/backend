import { createEnum } from '@deip/toolbox';

const QUEUE_TOPIC = createEnum({
  APP_EVENT: "my-topic", //TODO sync with devops and change it to app
  BLOCKCHAIN: "blockchain"
});

export default QUEUE_TOPIC;
