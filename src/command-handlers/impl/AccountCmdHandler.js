import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import TeamsService from './../../services/researchGroup';
import { TeamCreatedEvent } from './../../events';


class AccountCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const accountCmdHandler = new AccountCmdHandler();

const teamsService = new TeamsService();


accountCmdHandler.register(APP_CMD.CREATE_ACCOUNT, async (cmd, ctx) => {

  const { 
    entityId: accountId, 
    creator, 
    isTeamAccount, 
    description, 
    attributes 
  } = cmd.getCmdPayload();

  
  if (isTeamAccount) {
    const teamWriteModel = await teamsService.createResearchGroupRef({
      externalId: accountId,
      creator: creator,
      name: description, // TODO: extract from attributes
      description: description,
      attributes
    });
    
    ctx.state.appEvents.push(new TeamCreatedEvent({
      accountId: teamWriteModel._id,
      isTeamAccount: isTeamAccount,
      attributes: teamWriteModel.attributes
    }));
  }

});



module.exports = accountCmdHandler;