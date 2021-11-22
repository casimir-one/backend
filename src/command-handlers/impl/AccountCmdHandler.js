import { APP_CMD, USER_PROFILE_STATUS } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  TeamCreatedEvent,
  TeamUpdatedEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  TeamMemberJoinedEvent,
  TeamMemberLeftEvent,
  UserAuthorityAlteredEvent
} from './../../events';


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

accountCmdHandler.register(APP_CMD.ALTER_ACCOUNT_AUTHORITY, (cmd, ctx) => {
  const { 
    entityId,
    isTeamAccount,
    ownerAuth,
    memoKey
  } = cmd.getCmdPayload();

  if (!isTeamAccount) {
    ctx.state.appEvents.push(new UserAuthorityAlteredEvent({
      username: entityId,
      ownerAuth,
      memoKey
    }));
  }
});

accountCmdHandler.register(APP_CMD.JOIN_TEAM, (cmd, ctx) => {
  const { member, teamId, notes } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new TeamMemberJoinedEvent({
    member,
    teamId,
    notes,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});

accountCmdHandler.register(APP_CMD.LEAVE_TEAM, (cmd, ctx) => {
  const { member, teamId } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new TeamMemberLeftEvent({
    member: member,
    teamId: teamId,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});

module.exports = accountCmdHandler;