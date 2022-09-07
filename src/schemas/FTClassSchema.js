import mongoose from 'mongoose';
import { AssetType } from '@casimir.one/platform-core';

const Schema = mongoose.Schema;

const FTClassMetadataSchema = new Schema({
  "_id": false,
  "maxSupply": { type: String, required: false },
  "minBallance": { type: String, required: false }
});

const FTClassSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: false },
  "symbol": { type: String, required: true },
  "precision": { type: Number, required: false },
  "issuer": { type: String, required: true },
  "description": { type: String, required: false },
  "metadata": FTClassMetadataSchema,
  "type": {
    type: Number,
    enum: Object.values(AssetType),
    required: true,
    default: AssetType.FT
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const model = mongoose.model('ft-class', FTClassSchema);

module.exports = model;
