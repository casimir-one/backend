
import mongoose from 'mongoose';
import { USER_INVITE_STATUS } from './../constants';

const Schema = mongoose.Schema;

const UserInviteSchema = new Schema({
  "_id": { type: String },
  "portalId": { type: String, required: true },
  "invitee": { type: String, required: true, index: true },
  "creator": { type: String },
  "teamId": { type: String, required: true, index: true },
  "notes": { type: String, required: false, trim: true },
  "rewardShare": { type: String, default: undefined },
  "failReason": { type: String },
  "status": {
    type: Number,
    enum: [...Object.values(USER_INVITE_STATUS)],
    required: true
  },
  "expiration": { type: Number, required: true, index: true },
}, { timestamps: true });

const model = mongoose.model('user-invite', UserInviteSchema);

module.exports = model;