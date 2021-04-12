import UserNotificationService from './../services/userNotification';

const getNotificationsByUser = async (ctx) => {
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;
  const unreadOnly = ctx.query.unreadOnly === undefined ? true : ctx.query.unreadOnly;

  try {
    const userNotificationService = new UserNotificationService();

    if (username != jwtUsername) {
      // ctx.status = 403;
      // ctx.body = `You have no permission to make this action`
      // return;
      ctx.status = 200;
      ctx.body = [];
      return;
    }

    const notifications = await userNotificationService.getUserNotifications(username, unreadOnly ? 'unread' : undefined);
    ctx.status = 200;
    ctx.body = notifications;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const markUserNotificationAsRead = async (ctx) => {
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;
  const notificationId = ctx.params.notificationId;

  try {
    const userNotificationService = new UserNotificationService();

    if (username != jwtUsername) {
      // ctx.status = 403;
      // ctx.body = `You have no permission to make this action`
      // return;
      ctx.status = 200;
      ctx.body = [];
      return;
    }

    const notification = await userNotificationService.getUserNotification(notificationId);
    if (!notification) {
      ctx.status = 404;
      ctx.body = `User notification  ${notificationId} is not found`
      return;
    }

    const updatedNotification = await userNotificationService.updateUserNotification(notificationId, {
      status: 'read'
    });

    ctx.status = 200;
    ctx.body = updatedNotification;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const markAllUserNotificationAsRead = async (ctx) => {
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  try {
    const userNotificationService = new UserNotificationService();

    if (username != jwtUsername) {
      // ctx.status = 403;
      // ctx.body = `You have no permission to make this action`
      // return;
      ctx.status = 200;
      ctx.body = [];
      return;
    }

    const updateStat = await userNotificationService.updateUserNotifications(jwtUsername, { status: 'read' });
    ctx.status = 200;
    ctx.body = updateStat;

  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = err;
  }
}

export default {
  getNotificationsByUser,
  markUserNotificationAsRead,
  markAllUserNotificationAsRead
}
