import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectTokenSaleContributedEvent, ProjectTokenSaleCreatedEvent } from './../../events';


class InvestmentOpportunityCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}


const investmentOppCmdHandler = new InvestmentOpportunityCmdHandler();


investmentOppCmdHandler.register(APP_CMD.CREATE_PROJECT_TOKEN_SALE, (cmd, ctx) => {
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


investmentOppCmdHandler.register(APP_CMD.CONTRIBUTE_PROJECT_TOKEN_SALE, (cmd, ctx) => {
  const {
    tokenSaleId,
    contributor,
    amount
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectTokenSaleContributedEvent({
    tokenSaleId,
    contributor,
    amount
  }));
});


module.exports = investmentOppCmdHandler;