import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { TeamCreatedEvent, TeamUpdatedEvent, UserCreatedEvent, UserUpdatedEvent } from './../../events';
import { USER_PROFILE_STATUS } from './../../constants';


class AccountCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const accountCmdHandler = new AccountCmdHandler();



accountCmdHandler.register(APP_CMD.CREATE_ACCOUNT, (cmd, ctx) => {

  const { 
    entityId, 
    creator, 
    isTeamAccount, 
    description, 
    attributes,
    memoKey,
    email,
    roles
  } = cmd.getCmdPayload();

  
  if (isTeamAccount) {

    ctx.state.appEvents.push(new TeamCreatedEvent({
      creator: creator,
      accountId: entityId,
      attributes: attributes,
      isTeamAccount: isTeamAccount,
      description: description,
      proposalCtx: ctx.state.proposalsStackFrame
    }));
  }

  if (!isTeamAccount) {
    const tenant = ctx.state.tenant;
    ctx.state.appEvents.push(new UserCreatedEvent({
      username: entityId,
      status: USER_PROFILE_STATUS.APPROVED,
      pubKey: memoKey,
      tenantId: tenant.id,
      email,
      attributes,
      roles
    }));
  }

});

accountCmdHandler.register(APP_CMD.UPDATE_ACCOUNT, (cmd, ctx) => {

  const { 
    entityId, 
    creator, 
    isTeamAccount, 
    description, 
    attributes,
    email,
    status
  } = cmd.getCmdPayload();

  
  if (isTeamAccount) {
    ctx.state.appEvents.push(new TeamUpdatedEvent({
      creator: creator,
      accountId: entityId,
      attributes: attributes,
      isTeamAccount: isTeamAccount,
      description: description,
      proposalCtx: ctx.state.proposalsStackFrame
    }));
  }

  if (!isTeamAccount) {
    ctx.state.appEvents.push(new UserUpdatedEvent({
      username: entityId,
      attributes,
      email,
      status
    }));
  }
});

module.exports = accountCmdHandler;