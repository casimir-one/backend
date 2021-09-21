import mongoose from 'mongoose';
import { DEPOSIT_REQUEST_STATUS } from './../constants';

const Schema = mongoose.Schema;

const AssetDepositRequestSchema = new Schema({
  "assetId": { type: String, required: true },
  "currency": { type: String, required: true },
  "amount": { type: Number, required: true },
  "username": { type: String, required: true }, // user who makes a payment
  "account": { type: String, required: true }, // target balance owner
  "requestToken": { type: String, required: true, index: { unique: true } },
  "timestamp": { type: Number, required: true },
  "status": { type: Number, enum: [...Object.values(DEPOSIT_REQUEST_STATUS)], required: true, default: DEPOSIT_REQUEST_STATUS.PENDING },
  "txInfo": { type: Object, required: false },
  "invoice": { type: Object, required: false }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('asset-deposit-request', AssetDepositRequestSchema);

module.exports = model;