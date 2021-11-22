
import mongoose from 'mongoose';
import { USER_NOTIFICATION_STATUS, USER_NOTIFICATION_TYPE } from '@deip/constants';

const Schema = mongoose.Schema;

const UserNotificationSchema = new Schema({
  "tenantId": { type: String, required: true },
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
  "timestamps": {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const model = mongoose.model('user-notifications', UserNotificationSchema);

module.exports = model;