
import mongoose from 'mongoose';
import { SIGN_UP_POLICY, RESEARCH_COMPONENT_TYPE } from './../constants';

const Schema = mongoose.Schema;

const ResearchArea = new Schema({
  "_id": false,
  "id": { type: String, required: true },
  "parentId": { type: String },
  "title": { type: String, required: true },
  "disciplines": [{ type: String, required: true }],
});

const FAQ = new Schema({
  "question": { type: String, required: true },
  "answer": { type: String, required: true },
  "isVisible": { type: Boolean, required: true }
});

const ResearchComponent = new Schema({
  "type": { type: String, enum: [RESEARCH_COMPONENT_TYPE.STEPPER], required: true },
  "isVisible": { type: Boolean, required: true },
  "component": { type: Object, required: true }
});

const TenantProfile = new Schema({
    "_id": { type: String },
    "name": { type: String },
    "shortName": { type: String },
    "description": { type: String },
    "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "logo": { type: String, default: "default_tenant_logo.png" },
    "banner": { type: String, default: "default_banner_logo.png" },
    "admins": [{
      "name": { type: String, required: true, trim: true },
      "metadata": { type: Object, default: null }
    }],
    "settings": {
      "signUpPolicy": { type: String, enum: [SIGN_UP_POLICY.FREE, SIGN_UP_POLICY.ADMIN_APPROVAL], required: true },
      "researchAreas": [ResearchArea],
      "researchComponents": [ResearchComponent],
      "faq": [FAQ],
      "researchesBlacklist": [{ type: String, required: true, trim: true }],
      "researchesWhitelist": [{ type: String, required: true, trim: true }]
    }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });



const model = mongoose.model('tenants-profiles', TenantProfile);

module.exports = model;