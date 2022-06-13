import mongoose from 'mongoose';
import { ASSET_TYPE } from '@deip/constants';

const Schema = mongoose.Schema;

const FungibleTokenMetadataSchema = new Schema({
  "_id": false,
  "projectId": { type: String, required: false, default: null },
  "maxSupply": { type: String, required: false },
  "minBallance": { type: String, required: false }
});

const FungibleTokenSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: false },
  "symbol": { type: String, required: true },
  "precision": { type: Number, required: false },
  "issuer": { type: String, required: true },
  "description": { type: String, required: false },
  "metadata": FungibleTokenMetadataSchema,
  "type": {
    type: Number,
    enum: [...Object.values(ASSET_TYPE)],
    required: true,
    default: ASSET_TYPE.FT
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const model = mongoose.model('fungible-token', FungibleTokenSchema);

module.exports = model;
