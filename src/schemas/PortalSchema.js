
import { ASSESSMENT_CRITERIA_TYPE, NFT_ITEM_METADATA_TYPES, SIGN_UP_POLICY } from '@deip/constants';
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const FAQ = new Schema({
  "question": { type: String, required: true },
  "answer": { type: String, required: true },
  "isPublished": { type: Boolean, required: false }
});

const AttributeOverwrite = new Schema({
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "isFilterable": { type: Boolean, default: false },
  "isHidden": { type: Boolean, default: false },
  "isEditable": { type: Boolean, default: true },
  "isRequired": { type: Boolean, default: false }
});

const AppModuleMap = new Schema({
  "_id": false,
  "app-eci": { type: Boolean, default: false },
  "app-crowdfunding": { type: Boolean, default: false },
  "app-assets-management": { type: Boolean, default: false },
  "app-assets-withdrawal": { type: Boolean, default: false },
  "app-assets-deposit": { type: Boolean, default: false },
  "app-grants-management": { type: Boolean, default: false },
  "app-blockchain-explorer": { type: Boolean, default: false },
  "app-user-personal-workspace": { type: Boolean, default: false },

  "app-page-sign-up": { type: Boolean, default: false },
  "app-page-eci-overview": { type: Boolean, default: false },
  "app-page-eci-participiants": { type: Boolean, default: false },
  "app-page-assets": { type: Boolean, default: false },
  "app-page-multisig-transactions": { type: Boolean, default: false },

  "admin-panel-members-management": { type: Boolean, default: false },
  "admin-panel-members-registration": { type: Boolean, default: false },
  "admin-panel-nft-collections-management": { type: Boolean, default: false },
  "admin-panel-nft-collections-registration": { type: Boolean, default: false },
  "admin-panel-attributes-management": { type: Boolean, default: false },
  "admin-panel-attributes-registration": { type: Boolean, default: false },
  "admin-panel-faq-setup": { type: Boolean, default: false },
  "admin-panel-layouts-setup": { type: Boolean, default: false },
  "admin-panel-network-setup": { type: Boolean, default: false }
});

const UserRoleModuleMap = new Schema({
  "_id": false,
  "teamId": { type: String, required: false, default: null },
  "label": { type: String, required: true, trim: true },
  "role": { type: String, required: true, trim: true },
  "modules": AppModuleMap
});

const GlobalNetworkSettings = new Schema({
  "visiblePortalIds": { type: [String], default: [] },
  "isGlobalScopeVisible": { type: Boolean, default: false }
});

const NFTItemMetadataAssessmentCriteria = new Schema({
  "_id": false,
  "id": { type: Number, required: true },
  "title": { type: String, required: true },
  "max": { type: Number, required: true }
});

const NFTItemMetadataAssessmentCriterias = new Schema({
  "_id": false,
  "contentType": { type: Number, required: true },
  "values": [NFTItemMetadataAssessmentCriteria]
});

const PortalModerationConfigSchema = new Schema({
  "_id": false,
  "nftItemMetadataDraftModerationRequired": { type: Boolean, required: false },
  "moderators": { type: Array, required: false }
});

const PortalSchema = new Schema({
  "_id": { type: String },
  "name": { type: String },
  "serverUrl": { type: String, required: true },
  "shortName": { type: String },
  "description": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "logo": { type: String, default: "default_portal_logo.png" },
  "banner": { type: String, default: "default_banner_logo.png" },
  "network": GlobalNetworkSettings,
  "settings": {
    "signUpPolicy": {
      type: Number,
      enum: [...Object.values(SIGN_UP_POLICY)],
      required: true
    },
    "assesmentCriterias": {
      type: [NFTItemMetadataAssessmentCriterias],
      default: [{
        contentType: NFT_ITEM_METADATA_TYPES.UNKNOWN,
        values: [
          { id: ASSESSMENT_CRITERIA_TYPE.NOVELTY, title: 'Novelty', max: 5 },
          { id: ASSESSMENT_CRITERIA_TYPE.TECHNICAL_QUALITY, title: 'Technical Quality', max: 5 },
          { id: ASSESSMENT_CRITERIA_TYPE.COMMERCIALIZATION, title: 'Commercialization', max: 5 }
        ]
      }]
    },
    "attributeOverwrites": [AttributeOverwrite],
    "attributeSettings": { type: Object },
    "layoutSettings": { type: Object },
    "layouts": { type: Schema.Types.Mixed },
    "faq": [FAQ],
    "theme": { type: Object },
    "modules": AppModuleMap,
    "roles": [UserRoleModuleMap],
    "moderation": {
      type: PortalModerationConfigSchema,
      default: {}
    }
  }
}, { timestamps: true, minimize: false });

const model = mongoose.model('portal', PortalSchema);

module.exports = model;