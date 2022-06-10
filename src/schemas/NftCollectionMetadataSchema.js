
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const NftCollectionMetadataSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "issuer": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "isDefault": { type: Boolean, default: false },
  "issuedByTeam": { type: Boolean, default: false }
}, { timestamps: true });

const model = mongoose.model('nft-collection-metadata', NftCollectionMetadataSchema);

module.exports = model;