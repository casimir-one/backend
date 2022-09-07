import mongoose from 'mongoose';
import { AssetType } from '@casimir.one/platform-core';

const Schema = mongoose.Schema;

const AssetSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: false },
  "symbol": { type: String, required: false },
  "precision": { type: Number, required: false },
  "issuer": { type: String, required: true },
  "name": { type: String, required: false },
  "description": { type: String, required: false },
  "type": {
    type: Number,
    enum: Object.values(AssetType),
    required: true,
    default: AssetType.FT
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const model = mongoose.model('asset', AssetSchema);

module.exports = model;
