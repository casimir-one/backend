
import mongoose from 'mongoose';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';

const Schema = mongoose.Schema;

const UserNotification = new Schema({
    "tenantId": { type: String, required: true },
    "username": { type: String, required: true, index: true },
    "status": {
        type: String,
        enum : ['unread', 'read'],
        required: true
    },
    "type": {
        type: String,
        enum : [...Object.values(USER_NOTIFICATION_TYPE)],
        required: true
    },
    "metadata": { _id: false, type: Object, default: {} },
}, {
    "timestamps": {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    } 
});

const model = mongoose.model('user-notifications', UserNotification);

module.exports = model;