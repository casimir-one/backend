import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import TeamDomainService from './../../services/legacy/researchGroup'; // TODO: separate read/write schema
import { TeamCreatedEvent } from './../../events';


class AccountCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const accountCmdHandler = new AccountCmdHandler();

const teamDomainService = new TeamDomainService();


accountCmdHandler.register(APP_CMD.CREATE_ACCOUNT, async (cmd, ctx) => {

  const { 
    entityId: accountId, 
    creator, 
    isTeamAccount, 
    description, 
    attributes 
  } = cmd.getCmdPayload();

  
  if (isTeamAccount) {
    const team = await teamDomainService.createResearchGroupRef({
      externalId: accountId,
      creator: creator,
      name: description, // TODO: extract from attributes
      description: description,
      attributes
    });
    
    ctx.state.appEvents.push(new TeamCreatedEvent({
      accountId: team._id,
      attributes: team.attributes,
      isTeamAccount: isTeamAccount,
      proposalCtx: ctx.state.proposalsStackFrame
    }));
  }

});



module.exports = accountCmdHandler;