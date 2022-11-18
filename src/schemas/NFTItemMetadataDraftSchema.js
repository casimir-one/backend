
import mongoose from 'mongoose';
import { NftItemMetadataDraftStatus, NFT_ITEM_METADATA_FORMAT } from '@casimir.one/platform-core';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const NFTItemMetadataDraftSchema = new Schema({
  "portalId": { type: String, required: true },
  "nftCollectionId": { type: String, required: true },
  "nftItemId": { type: String, required: true },
  "owner": { type: String, required: true },
  "ownedByTeam": { type: Boolean, default: false },
  "attributes": [AttributeValueSchema],
  "hash": { type: String, index: true },
  "algo": { type: String },
  "queueNumber": { type: Number, default: -1 },
  "status": {
    type: Number,
    enum: Object.values(NftItemMetadataDraftStatus),
    default: NftItemMetadataDraftStatus.PROPOSED,
    required: true
  },
  "authors": [{ type: String }],
  "moderationMessage": { type: String },
  "lazySellProposalId": { type: String }, //TODO: remove when we have onchain market
}, { timestamps: true });

const model = mongoose.model('nft-item-metadata-draft', NFTItemMetadataDraftSchema);

module.exports = model;