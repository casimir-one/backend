import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ProjectInvestmentOpportunityEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const projectInvestmentOpportunityEventHandler = new ProjectInvestmentOpportunityEventHandler();


projectInvestmentOpportunityEventHandler.register(DOMAIN_EVENT.PROJECT_TOKEN_SALE_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_CREATED", event.getEventPayload());
});

projectInvestmentOpportunityEventHandler.register(DOMAIN_EVENT.PROJECT_TOKEN_SALE_ACTIVATED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_ACTIVATED", event.getEventPayload());
});

projectInvestmentOpportunityEventHandler.register(DOMAIN_EVENT.PROJECT_TOKEN_SALE_FINISHED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_FINISHED", event.getEventPayload());
});

projectInvestmentOpportunityEventHandler.register(DOMAIN_EVENT.PROJECT_TOKEN_SALE_EXPIRED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_EXPIRED", event.getEventPayload());
});

projectInvestmentOpportunityEventHandler.register(DOMAIN_EVENT.PROJECT_TOKEN_SALE_CONTRIBUTED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_CONTRIBUTED", event.getEventPayload());
});


module.exports = projectInvestmentOpportunityEventHandler;
