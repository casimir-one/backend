
import mongoose from 'mongoose';
import { USER_PROFILE_STATUS } from '@casimir.one/platform-core';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const UserRole = new Schema({
  "_id": false,
  "role": { type: String, required: true, trim: true },
  "label": { type: String, trim: true },
  "teamId": { type: String, required: true }
});

const UserSchema = new Schema({
  "_id": { type: String },
  "portalId": { type: String, required: true },
  "email": { type: String, required: false, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "pubKey": { type: String, required: true },
  "status": { 
    type: Number, 
    enum: [...Object.values(USER_PROFILE_STATUS)], 
    default: USER_PROFILE_STATUS.APPROVED,
    required: true
  },
  "teams": { type: [String], default: [] },
  "attributes": [AttributeValueSchema],
  "roles": [UserRole],
}, { timestamps: true });

const model = mongoose.model('user', UserSchema);

module.exports = model;
