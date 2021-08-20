import mongoose from 'mongoose';
import { ASSET_TYPE } from './../constants';

const Schema = mongoose.Schema;

const AssetSettingsSchema = new Schema({
  "_id": false,
  "projectId": { type: String, required: false, default: null },
  "maxSupply": { type: String, required: false },
  "minBallance": { type: String, required: false },
  "licenseRevenueHoldersShare": { type: String, required: false }
});

const AssetSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: false },
  "symbol": { type: String, required: true },
  "precision": { type: Number, required: true },
  "issuer": { type: String, required: true },
  "description": { type: String, required: false },
  "settings": AssetSettingsSchema,
  "type": {
    type: Number,
    enum: [...Object.values(ASSET_TYPE)],
    required: true,
    default: ASSET_TYPE.GENERAL
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const model = mongoose.model('assets', AssetSchema);

module.exports = model;
