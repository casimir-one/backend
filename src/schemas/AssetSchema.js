import mongoose from 'mongoose';
import { ASSET_TYPE } from './../constants';

const Schema = mongoose.Schema;

const AssetSchema = new Schema({
  "_id": { type: String, required: true },
  "stringSymbol": { type: String, required: true },
  "precision": { type: Number, required: true },
  "issuer": { type: String, required: true },
  "description": { type: String },
  "maxSupply": { type: Number, required: true },
  "tokenizedProjectId": { type: String },
  "licenseRevenueHoldersShare": { type: String },
  "type": {
    type: Number,
    enum: [...Object.values(ASSET_TYPE)],
    required: true
  },
});

const model = mongoose.model('asset', AssetSchema);

module.exports = model;
