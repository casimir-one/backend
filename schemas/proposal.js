
import mongoose from 'mongoose';
import { SMART_CONTRACT_TYPE } from './../constants';

const Schema = mongoose.Schema;

const ProposalRef = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "type": {
    type: Number,
    enum: [...Object.values(SMART_CONTRACT_TYPE)],
    required: true
  },
  "details": {
    type: Object,
    required: true
  }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('proposals', ProposalRef);

module.exports = model;