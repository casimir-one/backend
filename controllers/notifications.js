import Notification from './../schemas/notification';
import UserProfile from './../schemas/user';
import deipRpc from '@deip/deip-rpc-client';

const getNotificationsByUser = async (ctx) => {
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;
    const unreadOnly = ctx.query.unreadOnly === undefined ? true : ctx.query.unreadOnly;

    if (username != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You have no permission to make this action`
        return;
    }

    try {
        const query = { username: username };
        if (unreadOnly) {
            query.status = 'unread';
        }
        const notifications = await Notification.find(query).sort({ created_at: -1 })
        ctx.status = 200
        ctx.body = notifications;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}

const markUserNotificationAsRead = async (ctx) => {
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;
    const notificationId = ctx.params.notificationId;

    if (username != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You have no permission to make this action`
        return;
    }

    try {
        const notification = await Notification.findOne({'_id': notificationId});
        if (!notification) {
            ctx.status = 404;
            ctx.body = `Notification is not found`
            return;
        }

        notification.status = 'read';
        const updatedNotification = await notification.save()
        ctx.status = 200
        ctx.body = updatedNotification;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}

const markAllUserNotificationAsRead = async (ctx) => {
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;

    if (username != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You have no permission to make this action`
        return;
    }

    try {
        const updatedNotifications = [];
        const notifications = await Notification.find({'username': jwtUsername});
        for (let i = 0; i < notifications.length; i++) {
            const notification = notifications[i];
            notification.status = 'read';
            const updatedNotification = await notification.save();
            updatedNotifications.push(updatedNotification);
        }

        ctx.status = 200
        ctx.body = updatedNotifications;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}

export default {
    getNotificationsByUser,
    markUserNotificationAsRead,
    markAllUserNotificationAsRead
}
