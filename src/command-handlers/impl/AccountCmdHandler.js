import { APP_CMD, USER_PROFILE_STATUS } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  DaoCreatedEvent,
  DAOImportedEvent,
  DaoUpdatedEvent,
  DaoMemberAddedEvent,
  DaoMemberRemovedEvent,
  UserAuthorityAlteredEvent
} from './../../events';
import config from './../../config';
import { logError } from './../../utils/log';

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

  const daoInfo = {
    daoId: entityId,
    attributes,
    isTeamAccount,
  };

  if (isTeamAccount) {
    daoInfo.creator = creator;
    daoInfo.description = description;
  } else {
    daoInfo.status = USER_PROFILE_STATUS.APPROVED;
    daoInfo.pubKey = authority.owner.auths[0].key;
    daoInfo.email = email;
    daoInfo.roles = roles;
  }

  ctx.state.appEvents.push(new DaoCreatedEvent(daoInfo));
});

accountCmdHandler.register(APP_CMD.IMPORT_DAO, (cmd, ctx) => {

  const {
    entityId,
    authority,
    isTeamAccount,
    attributes,
    roles,
  } = cmd.getCmdPayload();

  const daoInfo = {
    daoId: entityId,
    attributes,
    isTeamAccount,
  };
  daoInfo.status = USER_PROFILE_STATUS.APPROVED;
  daoInfo.pubKey = authority.owner.auths[0].key;
  daoInfo.roles = roles;

  ctx.state.appEvents.push(new DAOImportedEvent(daoInfo));
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

  const daoInfo = {
    daoId: entityId,
    attributes,
    isTeamAccount
  };

  if (isTeamAccount) {
    daoInfo.creator = creator;
    daoInfo.description = description;
  } else {
    daoInfo.status = status;
    daoInfo.email = email;
  }

  ctx.state.appEvents.push(new DaoUpdatedEvent(daoInfo));
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