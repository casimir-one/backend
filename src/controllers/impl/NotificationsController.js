import BaseController from '../base/BaseController';
import { UserNotificationService } from '../../services';
import { BadRequestError, ForbiddenError } from './../../errors';
import { userSettingsCmdHandler } from './../../command-handlers';
import { APP_CMD, USER_NOTIFICATION_STATUS } from '@deip/constants';

const userNotificationService = new UserNotificationService();

class NotificationsController extends BaseController {
  getNotificationsByUser = this.query({
    h: async (ctx) => {
      try {
        const username = ctx.params.username;
        const jwtUsername = ctx.state.user.username;
        const unreadOnly = ctx.query.unreadOnly === undefined ? true : ctx.query.unreadOnly;
        if (username != jwtUsername) {
          throw new ForbiddenError(`You have no permission to make this action`);
        }
    
        const notifications = await userNotificationService.getUserNotifications(username, unreadOnly ? USER_NOTIFICATION_STATUS.UNREAD : undefined);
        ctx.status = 200;
        ctx.body = notifications;
      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  markUserNotificationsAsRead = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.MARK_NOTIFICATIONS_AS_READ);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { username } = appCmd.getCmdPayload();
          const jwtUsername = ctx.state.user.username;
          if (username !== jwtUsername) {
            throw new ForbiddenError(`You have no permission to create '${username}' bookmarks`);
          }
        };

        const msg = ctx.state.msg;
        await userSettingsCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
}

const notificationsCtrl = new NotificationsController();

module.exports = notificationsCtrl;