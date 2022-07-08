
import mongoose from 'mongoose';
import { NftItemMetadataDraftStatus, NFT_ITEM_METADATA_FORMAT } from '@casimir/platform-core';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const NFTItemMetadataDraftSchema = new Schema({
  "portalId": { type: String, required: true },
  "nftCollectionId": { type: String, required: true },
  "nftItemId": { type: String, required: true },
  "owner": { type: String, required: true },
  "ownedByTeam": { type: Boolean, default: false },
  "folder": { type: String, required: true },
  "title": { type: String },
  "attributes": [AttributeValueSchema],
  "hash": { type: String, index: true },
  "algo": { type: String },
  "formatType": {
    type: Number,
    enum: [...Object.values(NFT_ITEM_METADATA_FORMAT)],
  },
  "status": {
    type: Number,
    enum: Object.values(NftItemMetadataDraftStatus),
    required: true
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "jsonData": { type: Object },
  "metadata": { type: Object },
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
  "moderationMessage": { type: String },
  "lazySellProposalId": { type: String }, //TODO: remove when we have onchain market
}, { timestamps: true });

const model = mongoose.model('nft-item-metadata-draft', NFTItemMetadataDraftSchema);

module.exports = model;