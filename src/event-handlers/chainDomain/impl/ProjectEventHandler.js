import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ProjectEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const projectEventHandler = new ProjectEventHandler();


projectEventHandler.register(DOMAIN_EVENT.PROJECT_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_CREATED", event.getEventPayload());
});

projectEventHandler.register(DOMAIN_EVENT.PROJECT_UPDATED, async (event) => {
  console.log("CHAIN_PROJECT_UPDATED", event.getEventPayload());
});

projectEventHandler.register(DOMAIN_EVENT.PROJECT_REMOVED, async (event) => {
  console.log("CHAIN_PROJECT_REMOVED", event.getEventPayload());
});


module.exports = projectEventHandler;
