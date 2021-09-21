import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { InvestmentOpportunityService } from './../../services';


class InvestmentOpportunityEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }
}

const invstOppEventHandler = new InvestmentOpportunityEventHandler();
const invstOppService = new InvestmentOpportunityService();

invstOppEventHandler.register(APP_EVENT.INVESTMENT_OPPORTUNITY_CREATED, async (event) => {
  const { title, metadata, projectId, tokenSaleId } = event.getEventPayload();
  await invstOppService.createInvstOpp({
    invstOppId: tokenSaleId,
    projectId,
    title, 
    metadata
  });
});


invstOppEventHandler.register(APP_EVENT.INVESTMENT_OPPORTUNITY_PARTICIPATED, async (event) => {
  // TODO: create RM for InvstOpp participation
});


module.exports = invstOppEventHandler;