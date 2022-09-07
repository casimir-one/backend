
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';
import { NFT_ITEM_METADATA_FORMAT } from '@casimir.one/platform-core';

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
  "hash": { type: String, index: true },
  "algo": { type: String },
  "attributes": [AttributeValueSchema],
  "authors": [{ type: String }]
}, { timestamps: true });

const model = mongoose.model('nft-item-metadata', NFTItemMetadataSchema);

module.exports = model;