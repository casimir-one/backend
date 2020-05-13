
import mongoose from 'mongoose';
import USER_PROFILE_STATUS from './../constants/userProfileStatus';

const Schema = mongoose.Schema;

const UserProfile = new Schema({
  "_id": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "signUpPubKey": { type: String, default: null },
  "status": { type: String, enum: [USER_PROFILE_STATUS.PENDING, USER_PROFILE_STATUS.APPROVED], required: true },
  "tenant": { type: String, default: "deip" },
  "avatar": { type: String, default: "default-avatar.png" },
  "firstName": { type: String, default: null, trim: true },
  "lastName": { type: String, default: null, trim: true },
  "bio": { type: String, default: null, trim: true },
  "birthdate": { type: Date, default: null },
  "category": { type: String, default: null, trim: true },
  "occupation": { type: String, default: null, trim: true },
  "roles": [{
    "role": { type: String, required: true, trim: true },
    "researchGroupExternalId": { type: String, required: true },
    "metadata": { type: Object, default: null }
  }],
  "location": {
    "city": { type: String, trim: true, default: null },
    "country": { type: String, trim: true, default: null },
    "address": { type: String, trim: true, default: null }
  },
  "webPages": [{
    "_id": false,
    "type": {
      type: String,
      enum: ['webpage', 'facebook', 'linkedin', 'twitter', 'vk'],
      required: true
    },
    "label": { type: String, default: null, required: true, trim: true },
    "link": { type: String, required: true, trim: true },
    "metadata": { type: Object, default: null }
  }],
  "phoneNumbers": [{
    "_id": false,
    "label": { type: String, default: null, required: true, trim: true },
    "ext": { type: String, default: null, trim: true },
    "number": { type: String, required: true, trim: true }
  }],
  "education": [{
    "_id": false,
    "educationalInstitution": { type: String, required: true, trim: true },
    "period": {
      "from": { type: Date, default: null },
      "to": { type: Date, default: null }
    },
    "degree": { type: String, required: true },
    "area": { type: String, required: true },
    "description": { type: String, default: null },
    "isActive": { type: Boolean, required: true, default: false }
  }],
  "employment": [{
    "_id": false,
    "company": { type: String, required: true, trim: true },
    "location": {
      "city": { type: String, trim: true, default: null },
      "country": { type: String, trim: true, default: null }
    },
    "period": {
      "from": { type: Date, default: null },
      "to": { type: Date, default: null }
    },
    "position": { type: String, required: true },
    "description": { type: String, default: null },
    "isActive": { type: Boolean, required: true, default: false }
  }],
  "foreignIds": [{
    "_id": false,
    "label": { type: String, required: true, trim: true },
    "id": { type: String, required: true, trim: true },
  }]
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('user-profile', UserProfile);

module.exports = model;