
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';
import { NFT_ITEM_METADATA_FORMAT } from '@deip/constants';

const Schema = mongoose.Schema;

const idSchema = new Schema({
  "_id": false,
  "nftItemId": { type: String, required: true },
  "nftCollectionId": { type: String, required: true }
});

const NFTItemMetadataSchema = new Schema({
  "_id": idSchema,
  "portalId": { type: String, required: true },
  "nftCollectionId": { type: String, required: true },
  "owner": { type: String, required: false }, //in case of nft owned by address without dao
  "ownerAddress": { type: String, required: false },
  "ownedByTeam": { type: Boolean, default: false },
  "folder": { type: String, required: true },
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "attributes": [AttributeValueSchema],
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

const model = mongoose.model('nft-item-metadata', NFTItemMetadataSchema);

module.exports = model;