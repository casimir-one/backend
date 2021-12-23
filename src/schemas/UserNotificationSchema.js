
import mongoose from 'mongoose';
import { USER_NOTIFICATION_STATUS, USER_NOTIFICATION_TYPE } from '@deip/constants';

const Schema = mongoose.Schema;

const UserNotificationSchema = new Schema({
  "portalId": { type: String, required: true },
  "username": { type: String, required: true, index: true },
  "status": {
    type: Number,
    enum: [...Object.values(USER_NOTIFICATION_STATUS)],
    required: true
  },
  "type": {
    type: Number,
    enum: [...Object.values(USER_NOTIFICATION_TYPE)],
    required: true
  },
  "metadata": { _id: false, type: Object, default: {} },
}, {
  "timestamps": true
});

const model = mongoose.model('user-notification', UserNotificationSchema);

module.exports = model;