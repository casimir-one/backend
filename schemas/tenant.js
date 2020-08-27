
import mongoose from 'mongoose';
import { SIGN_UP_POLICY, RESEARCH_COMPONENT_TYPE, NEW_RESEARCH_POLICY } from './../constants';

const Schema = mongoose.Schema;

const FAQ = new Schema({
  "question": { type: String, required: true },
  "answer": { type: String, required: true },
  "isVisible": { type: Boolean, required: true }
});

const ResearchAttributeValueOption = new Schema({
  "_id": false,
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "value": { type: Schema.Types.ObjectId, default: null }
});

const ResearchAttribute = new Schema({
  "type": { 
    type: String, 
    enum: [
      RESEARCH_COMPONENT_TYPE.STEPPER,
      RESEARCH_COMPONENT_TYPE.TEXT,
      RESEARCH_COMPONENT_TYPE.TEXTAREA,
      RESEARCH_COMPONENT_TYPE.SELECT
    ],
    required: true
  },
  "isVisible": { type: Boolean, required: true },
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "valueOptions": [ResearchAttributeValueOption],
  "defaultValue": { type: Schema.Types.Mixed, default: null },

  "component": { type: Object, required: false } // temp for migration
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
      "researchAttributes": [ResearchAttribute],
      "researchCategories": [ResearchCategory],
      "faq": [FAQ],
      "researchBlacklist": [{ type: String, required: true, trim: true }],
      "researchWhitelist": [{ type: String, required: true, trim: true }],
      "theme": { type: Object },
      "modules": {
        "review": { type: Boolean, default: false },
        "fundraising": { type: Boolean, default: false }
      },

      "researchComponents": [ResearchAttribute], // temp for migration
    }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });



const model = mongoose.model('tenants-profiles', TenantProfile);

module.exports = model;