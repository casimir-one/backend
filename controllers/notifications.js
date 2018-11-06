import Notification from './../schemas/notification';
import UserProfile from './../schemas/user';
import deipRpc from '@deip/deip-rpc-client';

const createResearchGroupNotification = async (ctx) => {
    const groupId = parseInt(ctx.params.groupId);
    const jwtUsername = ctx.state.user.username;
    const body = ctx.request.body;
    const type = body.type;
    const meta = body.meta;

    if (!isNotificationTypeValid(type) || !meta) {
        ctx.status = 400;
        ctx.body = `Provide a valid notification type and meta info`;
        return;
    }

    try {

        const group = await deipRpc.api.getResearchGroupByIdAsync(groupId);
        if (!group || group.is_personal) {
            ctx.status = 201;
            return;
        }

        // const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(jwtUsername);
        const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(groupId);
        if (!rgtList.some(rgt => rgt.owner == jwtUsername)) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not a member of "${groupId}" group;`
            return;
        }

        const notifications = [];
        for (let i = 0; i < rgtList.length; i++) {
            const rgt = rgtList[i];

            if (type == 'proposal') {

                const creatorProfile = await UserProfile.findOne({'_id': meta.creator});
                meta.creatorProfile = creatorProfile;
                meta.groupInfo = group;

                const notification = new Notification({
                    username: rgt.owner,
                    status: 'unread',
                    type: 'proposal',
                    meta: meta
                });
                const savedNotification = await notification.save();
                notifications.push(savedNotification);
            }
        }
    
        ctx.status = 200
        ctx.body = notifications;

    } catch (err) {
        console.log(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}

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
        const notifications = await Notification.find(query)
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


const isNotificationTypeValid = (type) => {
    return type == 'proposal';
}

export default {
    createResearchGroupNotification,
    getNotificationsByUser,
    markUserNotificationAsRead,
    markAllUserNotificationAsRead
}
