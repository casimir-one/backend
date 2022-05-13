import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ProjectNdaEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const projectNdaEventHandler = new ProjectNdaEventHandler();


projectNdaEventHandler.register(DOMAIN_EVENT.PROJECT_NDA_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_CREATED", event.getEventPayload());
});

projectNdaEventHandler.register(DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_ACCESS_REQUEST_CREATED", event.getEventPayload());
});

projectNdaEventHandler.register(DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_FULFILLED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_ACCESS_REQUEST_FULFILLED", event.getEventPayload());
});

projectNdaEventHandler.register(DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_REJECTED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_ACCESS_REQUEST_REJECTED", event.getEventPayload());
});


module.exports = projectNdaEventHandler;
