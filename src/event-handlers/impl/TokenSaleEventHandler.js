import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { InvestmentOpportunityService } from './../../services';


class TokenSaleEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }
}

const tokenSaleEventHandler = new TokenSaleEventHandler();
const investmentOpService = new InvestmentOpportunityService();

tokenSaleEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_CREATED, async (event) => {
  const { title, metadata, projectId, tokenSaleId } = event.getEventPayload();
  await investmentOpService.createInvestmentOpportunity({ 
    tokenSaleId,
    projectId,
    title, 
    metadata
  });
  
});


module.exports = tokenSaleEventHandler;