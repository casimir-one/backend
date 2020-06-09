
import mongoose from 'mongoose';
import { SIGN_UP_POLICY, RESEARCH_COMPONENT_TYPE, NEW_RESEARCH_POLICY } from './../constants';

const Schema = mongoose.Schema;

const FAQ = new Schema({
  "question": { type: String, required: true },
  "answer": { type: String, required: true },
  "isVisible": { type: Boolean, required: true }
});

const ResearchCriteria = new Schema({
  "type": { type: String, enum: [RESEARCH_COMPONENT_TYPE.STEPPER], required: true },
  "isVisible": { type: Boolean, required: true },
  "component": { type: Object, required: true }
});

const ResearchCategory = new Schema({
  "text": { type: String, required: true }
});

const TenantProfile = new Schema({
    "_id": { type: String },
    "name": { type: String },
    "shortName": { type: String },
    "description": { type: String },
    "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
    "logo": { type: String, default: "default_tenant_logo.png" },
    "banner": { type: String, default: "default_banner_logo.png" },
    "settings": {
      "signUpPolicy": { 
        type: String, 
        enum: [
          SIGN_UP_POLICY.FREE, 
          SIGN_UP_POLICY.ADMIN_APPROVAL
        ], 
        required: true 
      },
      "newResearchPolicy": { 
        type: String,
        enum: [
          NEW_RESEARCH_POLICY.FREE, 
          NEW_RESEARCH_POLICY.ADMIN_APPROVAL
        ], 
        required: true 
      },
      "researchComponents": [ResearchCriteria],
      "researchCategories": [ResearchCategory],
      "faq": [FAQ],
      "researchBlacklist": [{ type: String, required: true, trim: true }],
      "researchWhitelist": [{ type: String, required: true, trim: true }],
      "theme": { type: Object },
      "modules": {
        "review": { type: Boolean, default: false },
        "fundraising": { type: Boolean, default: false }
      }
    }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });



const model = mongoose.model('tenants-profiles', TenantProfile);

module.exports = model;