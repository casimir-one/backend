
import mongoose from 'mongoose';
import { CONTRACT_AGREEMENT_STATUS } from './../constants';

const Schema = mongoose.Schema;

const IncomeShareAgreementSchema = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "status": { type: Number, enum: [...Object.values(CONTRACT_AGREEMENT_STATUS)], required: true, default: CONTRACT_AGREEMENT_STATUS.PENDING },
  "creator": { type: String, required: true},
  "parties": { type: Array, required: true},
  "hash": { type: String, required: true},
  "startTime": { type: Date },
  "endTime": { type: Date },
  "proposalId": { type: String },
  "acceptedByParties": { type: Array, default: [] },
  "terms": { type: Object, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });


const model = mongoose.model('income-share-agreement', IncomeShareAgreementSchema);

module.exports = model;