import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { InvestmentOpportunityCreatedEvent, InvestmentOpportunityParticipatedEvent } from './../../events';


class InvestmentOpportunityCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}


const invstOppCmdHandler = new InvestmentOpportunityCmdHandler();


invstOppCmdHandler.register(APP_CMD.CREATE_INVESTMENT_OPPORTUNITY, (cmd, ctx) => {
  const {
    entityId: investmentOpportunityId,
    teamId,
    projectId,
    startTime,
    endTime,
    shares,
    softCap,
    hardCap,
    creator,
    title,
    metadata,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new InvestmentOpportunityCreatedEvent({
    investmentOpportunityId,
    teamId,
    projectId,
    startTime,
    endTime,
    shares,
    softCap,
    hardCap,
    creator,
    title,
    metadata
  }));
  
});


invstOppCmdHandler.register(APP_CMD.INVEST, (cmd, ctx) => {
  const {
    investmentOpportunityId,
    investor,
    asset
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new InvestmentOpportunityParticipatedEvent({
    investmentOpportunityId,
    investor,
    asset
  }));
  
});


module.exports = invstOppCmdHandler;