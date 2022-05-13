import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ProjectDomainEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const projectDomainEventHandler = new ProjectDomainEventHandler();


projectDomainEventHandler.register(DOMAIN_EVENT.PROJECT_DOMAIN_ADDED, async (event) => {
  console.log("CHAIN_PROJECT_DOMAIN_ADDED", event.getEventPayload());
});


module.exports = projectDomainEventHandler;
