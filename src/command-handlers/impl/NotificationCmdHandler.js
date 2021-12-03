import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { NotificationsMarkedAsReadEvent } from './../../events';

class NotificationCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const notificationCmdHandler = new NotificationCmdHandler();

notificationCmdHandler.register(APP_CMD.MARK_NOTIFICATIONS_AS_READ, (cmd, ctx) => {
  const data = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NotificationsMarkedAsReadEvent(data));
});

module.exports = notificationCmdHandler;