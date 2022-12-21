
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const CollectionSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "ownerId": { type: String, required: true },
  "attributes": [AttributeValueSchema]
}, { timestamps: true });

const model = mongoose.model('nft-collection', CollectionSchema);

module.exports = model;