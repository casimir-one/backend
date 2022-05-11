import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ProjectContentEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const projectContentEventHandler = new ProjectContentEventHandler();


projectContentEventHandler.register(DOMAIN_EVENT.PROJECT_CONTENT_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_CONTENT_CREATED", event.getEventPayload());
});

module.exports = projectContentEventHandler;
