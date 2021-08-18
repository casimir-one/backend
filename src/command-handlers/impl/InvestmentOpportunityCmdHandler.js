import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectTokenSaleInvestedEvent, ProjectTokenSaleCreatedEvent } from './../../events';


class InvestmentOpportunityCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}


const investmentOppCmdHandler = new InvestmentOpportunityCmdHandler();


investmentOppCmdHandler.register(APP_CMD.CREATE_INVESTMENT_OPPORTUNITY, (cmd, ctx) => {
  const {
    entityId: tokenSaleId,
    teamId,
    projectId,
    startTime,
    endTime,
    securityTokensOnSale,
    softCap,
    hardCap,
    creator,
    title,
    metadata,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectTokenSaleCreatedEvent({
    tokenSaleId,
    teamId,
    projectId,
    startTime,
    endTime,
    securityTokensOnSale,
    softCap,
    hardCap,
    creator,
    title,
    metadata
  }));
  
});


investmentOppCmdHandler.register(APP_CMD.INVEST, (cmd, ctx) => {
  const {
    tokenSaleId,
    investor,
    amount
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectTokenSaleInvestedEvent({
    tokenSaleId,
    investor,
    amount
  }));
});


module.exports = investmentOppCmdHandler;