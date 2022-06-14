
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';
import { NFT_ITEM_METADATA_FORMAT, NFT_ITEM_METADATA_TYPES } from '@deip/constants';

const Schema = mongoose.Schema;

const idSchema = new Schema({
  "_id": false,
  "nftItemId": { type: String, required: true },
  "nftCollectionId": { type: String, required: true }
});

const NftItemMetadataSchema = new Schema({
  "_id": idSchema,
  "portalId": { type: String, required: true },
  "nftCollectionId": { type: String, required: true },
  "owner": { type: String, required: true },
  "ownedByTeam": { type: Boolean, default: false },
  "folder": { type: String, required: true },
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "attributes": [AttributeValueSchema],
  "contentType": {
    type: Number,
    enum: [...Object.values(NFT_ITEM_METADATA_TYPES)],
    default: NFT_ITEM_METADATA_TYPES.ANNOUNCEMENT
  },
  "formatType": {
    type: Number,
    enum: [...Object.values(NFT_ITEM_METADATA_FORMAT)],
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
}, { timestamps: true });

const model = mongoose.model('nft-item-metadata', NftItemMetadataSchema);

module.exports = model;