
import mongoose from 'mongoose';
import { SIGN_UP_POLICY, RESEARCH_ATTRIBUTE_TYPE, RESEARCH_ATTRIBUTE_AREA, NEW_RESEARCH_POLICY } from './../constants';

const Schema = mongoose.Schema;

const FAQ = new Schema({
  "question": { type: String, required: true },
  "answer": { type: String, required: true },
  "isPublished": { type: Boolean, required: false },

  "isVisible": { type: Boolean, required: false } // temp for migration
});

const ResearchAttributeValueOption = new Schema({
  "_id": false,
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "value": { type: Schema.Types.ObjectId, default: null }
});

const BlockchainFieldMeta = new Schema({
  "_id": false,
  "field": { type: String, required: true },
  "isPartial": { type: Boolean, required: false, default: false }
});

const ResearchAttribute = new Schema({
  "type": {
    type: String,
    enum: [...Object.values(RESEARCH_ATTRIBUTE_TYPE)],
    required: true
  },
  "isFilterable": { type: Boolean, default: false },
  "isEditable": { type: Boolean, default: true },
  "isRequired": { type: Boolean, default: false },
  "isHidden": { type: Boolean, default: false },
  "isMultiple": { type: Boolean, default: false },
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "valueOptions": [ResearchAttributeValueOption],
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "blockchainFieldMeta": BlockchainFieldMeta,


  "isPublished": { type: Boolean, required: false }, // temp for migration
  "isVisible": { type: Boolean, required: false }, // temp for migration
  "isBlockchainMeta": { type: Boolean, default: false }, // temp for migration
  "component": { type: Object, required: false } // temp for migration
});

const AppModuleMap = new Schema({
  "_id": false,
  "app-eci": { type: Boolean, default: true },
  "app-crowdfunding": { type: Boolean, default: true },
  "app-expert-review": { type: Boolean, default: true },
  "app-assets-management": { type: Boolean, default: true },
  "app-assets-withdrawal": { type: Boolean, default: true },
  "app-assets-deposit": { type: Boolean, default: true },
  "app-grants-management": { type: Boolean, default: true },
  "app-blockchain-explorer": { type: Boolean, default: true },
  "app-user-personal-workspace": { type: Boolean, default: true },
  "admin-panel-members-management": { type: Boolean, default: true },
  "admin-panel-members-registration": { type: Boolean, default: true },
  "admin-panel-projects-management": { type: Boolean, default: true },
  "admin-panel-projects-registration": { type: Boolean, default: true },
  "admin-panel-attributes-management": { type: Boolean, default: true },
  "admin-panel-attributes-registration": { type: Boolean, default: true },
  "admin-panel-faq-setup": { type: Boolean, default: true },
  "admin-panel-review-setup": { type: Boolean, default: true },
  "admin-panel-layouts-setup": { type: Boolean, default: true },
  "admin-panel-network-setup": { type: Boolean, default: true }
});

const UserRoleModuleMap = new Schema({
  "_id": false,
  "label": { type: String, required: true, trim: true },
  "role": { type: String, required: true, trim: true },
  "modules": AppModuleMap
});

const GlobalNetworkSettings = new Schema({
  "scope": [String],
  "nodes": [String]
});

const TenantProfile = new Schema({
  "_id": { type: String },
  "name": { type: String },
  "serverUrl": { type: String, required: true },
  "shortName": { type: String },
  "description": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "logo": { type: String, default: "default_tenant_logo.png" },
  "banner": { type: String, default: "default_banner_logo.png" },
  "network": GlobalNetworkSettings,
  "settings": {
    "signUpPolicy": {
      type: String,
      enum: [...Object.values(SIGN_UP_POLICY)],
      required: true
    },
    "newResearchPolicy": {
      type: String,
      enum: [...Object.values(NEW_RESEARCH_POLICY)],
      required: true
    },
    "researchAttributes": [ResearchAttribute],
    "researchLayouts": { type: Object },
    "faq": [FAQ],
    "theme": { type: Object },
    "modules": AppModuleMap,
    "roles": [UserRoleModuleMap]
  }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' }, minimize: false });

const model = mongoose.model('tenants-profiles', TenantProfile);

module.exports = model;