import { APP_CMD, USER_PROFILE_STATUS } from '@casimir.one/platform-core';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { UserCreatedEvent, UserUpdatedEvent } from './../../events';


class UserCmdHandler extends BaseCmdHandler {
  constructor() {
    super();
  }
}

const userCmdHandler = new UserCmdHandler();


userCmdHandler.register(APP_CMD.CREATE_USER, (cmd, ctx) => {
  const {
    _id,
    email,
    pubKey,
    attributes,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new UserCreatedEvent({
    _id,
    email,
    pubKey,
    attributes,
    status: USER_PROFILE_STATUS.APPROVED,
  }));

});


userCmdHandler.register(APP_CMD.UPDATE_USER, (cmd, ctx) => {
  const {
    _id,
    email,
    pubKey,
    attributes,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new UserUpdatedEvent({
    _id,
    email,
    pubKey,
    attributes,
  }));

});


module.exports = userCmdHandler;