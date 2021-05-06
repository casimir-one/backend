import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { TeamCreatedEvent } from './../../events';


class AccountCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const accountCmdHandler = new AccountCmdHandler();



accountCmdHandler.register(APP_CMD.CREATE_ACCOUNT, (cmd, ctx) => {

  const { 
    entityId: accountId, 
    creator, 
    isTeamAccount, 
    description, 
    attributes 
  } = cmd.getCmdPayload();

  
  if (isTeamAccount) {

    ctx.state.appEvents.push(new TeamCreatedEvent({
      creator: creator,
      accountId: accountId,
      attributes: attributes,
      isTeamAccount: isTeamAccount,
      description: description,
      proposalCtx: ctx.state.proposalsStackFrame
    }));
  }

});



module.exports = accountCmdHandler;