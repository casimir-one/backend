import { APP_CMD, USER_PROFILE_STATUS } from '@casimir.one/platform-core';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { UserCreatedEvent } from './../../events';


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
    roles,
    attributes,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new UserCreatedEvent({
    _id,
    email,
    pubKey,
    roles,
    attributes,
    status: USER_PROFILE_STATUS.APPROVED,
  }));

});


module.exports = userCmdHandler;