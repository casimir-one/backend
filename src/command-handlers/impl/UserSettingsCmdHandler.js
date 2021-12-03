import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { BookmarkCreatedEvent, BookmarkDeletedEvent } from './../../events';

class UserSettingsCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const userSettingsCmdHandler = new UserSettingsCmdHandler();

userSettingsCmdHandler.register(APP_CMD.CREATE_BOOKMARK, (cmd, ctx) => {
  const data = cmd.getCmdPayload();

  ctx.state.appEvents.push(new BookmarkCreatedEvent(data));
});

userSettingsCmdHandler.register(APP_CMD.DELETE_BOOKMARK, (cmd, ctx) => {
  const data = cmd.getCmdPayload();

  ctx.state.appEvents.push(new BookmarkDeletedEvent(data));
});

module.exports = userSettingsCmdHandler;