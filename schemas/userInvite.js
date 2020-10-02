
import mongoose from 'mongoose';
import { USER_INVITE_STATUS } from './../constants';

const Schema = mongoose.Schema;

const UserInvite = new Schema({
  "_id": { type: String },
  "invitee": { type: String, required: true, index: true },
  "creator": { type: String },
  "researchGroupExternalId": { type: String, required: true, index: true },
  "notes": { type: String, required: false, trim: true },
  "rewardShare": { type: String, default: null },
  "failReason": { type: String },
  "approvedBy": [{ type: String }],
  "rejectedBy": [{ type: String }],
  "researches": [{ type: String }],
  "status": {
    type: String,
    enum: [...Object.values(USER_INVITE_STATUS)],
    required: true
  },
  "expiration": { type: Date, required: true, index: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('user-invites', UserInvite);

module.exports = model;