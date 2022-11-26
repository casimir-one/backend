
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AppModuleMap = new Schema({
  "_id": false,
  "page-for-access": { type: Boolean, default: false }
});

const UserRoleModuleMap = new Schema({
  "_id": false,
  "teamId": { type: String, required: false, default: null },
  "label": { type: String, required: true, trim: true },
  "role": { type: String, required: true, trim: true },
  "modules": AppModuleMap
});

const NFTModerationConfigSchema = new Schema({
  "_id": false,
  "isRequired": { type: Boolean, required: false },
  "moderators": { type: Array, required: false }
});

const PortalSchema = new Schema({
  "_id": { type: String },
  "name": { type: String },
  "shortName": { type: String },
  "description": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "logo": { type: String, default: "default_portal_logo.png" },
  "banner": { type: String, default: "default_banner_logo.png" },
  "maxQueueNumber": {type: Number, default: 0 },
  "settings": {
    "nftCollectionId": { type: String, default: null }, // active collection
    "attributeMappings": { type: Object },
    "layoutMappings": { type: Object },
    "theme": { type: Object },
    "modules": AppModuleMap,
    "roles": [UserRoleModuleMap],
    "nftModeration": {
      type: NFTModerationConfigSchema,
      default: {}
    }
  }
}, { timestamps: true, minimize: false });

const model = mongoose.model('portal', PortalSchema);

module.exports = model;