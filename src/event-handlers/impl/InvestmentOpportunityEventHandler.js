import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { InvestmentOpportunityService } from './../../services';


class InvestmentOpportunityEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }
}

const investmentOpportunityEventHandler = new InvestmentOpportunityEventHandler();
const investmentOpService = new InvestmentOpportunityService();

investmentOpportunityEventHandler.register(APP_EVENT.INVESTMENT_OPPORTUNITY_CREATED, async (event) => {
  const { title, metadata, projectId, tokenSaleId } = event.getEventPayload();
  await investmentOpService.createInvestmentOpportunity({ 
    tokenSaleId,
    projectId,
    title, 
    metadata
  });
});


investmentOpportunityEventHandler.register(APP_EVENT.INVESTMENT_OPPORTUNITY_PARTICIPATED, async (event) => {
  // TODO: create RM for InvstOpp participiation
});


module.exports = investmentOpportunityEventHandler;