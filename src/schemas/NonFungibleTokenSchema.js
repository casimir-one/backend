import mongoose from 'mongoose';
import { ASSET_TYPE } from '@deip/constants';

const Schema = mongoose.Schema;

const NonFungibleTokenSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: false },
  "instancesCount": { type: Number, default: 0 },
  "metadata": { type: Object },
  "metadataHash": { type: String },
  "issuer": { type: String, required: true },
  "name": { type: String, required: false },
  "description": { type: String, required: false }
});

const model = mongoose.model('non-fungible-token', NonFungibleTokenSchema);

module.exports = model;
