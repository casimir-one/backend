
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const NFTCollectionSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "ownerId": { type: String, required: true },
  "attributes": [AttributeValueSchema]
}, { timestamps: true });

const model = mongoose.model('nft-collection', NFTCollectionSchema);

module.exports = model;