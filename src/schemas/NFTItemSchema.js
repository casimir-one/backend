
import mongoose from 'mongoose';
import { NftItemMetadataDraftStatus } from '@casimir.one/platform-core';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const NFTItemSchema = new Schema({
  "portalId": { type: String, required: true },
  "nftCollectionId": { type: String, required: false },
  "ownerId": { type: String, required: true },
  "creatorId": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "hash": { type: String, index: true },
  "algo": { type: String },
  "queueNumber": { type: Number, default: -1 },
  "status": {
    type: Number,
    enum: Object.values(NftItemMetadataDraftStatus),
    default: NftItemMetadataDraftStatus.PROPOSED,
    required: true
  }
}, { timestamps: true });

const model = mongoose.model('nft-item', NFTItemSchema);

module.exports = model;