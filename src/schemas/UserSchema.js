
import mongoose from 'mongoose';
import USER_PROFILE_STATUS from './../constants/userProfileStatus';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;


const UserRole = new Schema({
  "_id": false,
  "role": { type: String, required: true, trim: true },
  "label": { type: String, trim: true },
  "researchGroupExternalId": { type: String, required: true }
});

const UserSchema = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "signUpPubKey": { type: String, default: null },
  "status": { type: String, enum: [...Object.values(USER_PROFILE_STATUS)], required: true },
  "teams": { type: [String], default: [] },
  "attributes": [AttributeValueSchema],
  "roles": [UserRole],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('user-profile', UserSchema);

module.exports = model;