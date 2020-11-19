
import mongoose from 'mongoose';
import ExpressLicenseRequest from './expressLicenseRequest';
import { PROPOSAL_TYPE } from './../constants';

const Schema = mongoose.Schema;

const ProposalRef = new Schema({
  "_id": { type: String, required: true },
  "type": {
    type: Number,
    enum: [...Object.values(PROPOSAL_TYPE)],
    required: true
  },
  "details": {
    type: Object,
    required: true
  }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('proposals', ProposalRef);

module.exports = model;