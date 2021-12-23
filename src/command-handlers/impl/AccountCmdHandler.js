import { APP_CMD, USER_PROFILE_STATUS } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  TeamCreatedEvent,
  TeamUpdatedEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  DaoMemberAddedEvent,
  DaoMemberRemovedEvent,
  UserAuthorityAlteredEvent
} from './../../events';


class AccountCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const accountCmdHandler = new AccountCmdHandler();



accountCmdHandler.register(APP_CMD.CREATE_DAO, (cmd, ctx) => {

  const { 
    entityId,
    creator,
    authority,
    isTeamAccount,
    description,
    attributes,
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

  } else {

    const portal = ctx.state.portal;
    ctx.state.appEvents.push(new UserCreatedEvent({
      username: entityId,
      status: USER_PROFILE_STATUS.APPROVED,
      pubKey: authority.owner.auths[0].key,
      portalId: portal.id,
      email,
      attributes,
      roles
    }));

  }

});

accountCmdHandler.register(APP_CMD.UPDATE_DAO, (cmd, ctx) => {

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
    
  } else {

    ctx.state.appEvents.push(new UserUpdatedEvent({
      username: entityId,
      attributes,
      email,
      status
    }));

  }
});

accountCmdHandler.register(APP_CMD.ALTER_DAO_AUTHORITY, (cmd, ctx) => {
  const { 
    entityId,
    isTeamAccount,
    authority,
  } = cmd.getCmdPayload();

  if (!isTeamAccount) {
    ctx.state.appEvents.push(new UserAuthorityAlteredEvent({
      username: entityId,
      authority
    }));
  }
});

accountCmdHandler.register(APP_CMD.ADD_DAO_MEMBER, (cmd, ctx) => {
  const { member, teamId, notes } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new DaoMemberAddedEvent({
    member,
    teamId,
    notes,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});

accountCmdHandler.register(APP_CMD.REMOVE_DAO_MEMBER, (cmd, ctx) => {
  const { member, teamId } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new DaoMemberRemovedEvent({
    member: member,
    teamId: teamId,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});

module.exports = accountCmdHandler;