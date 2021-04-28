
import mongoose from 'mongoose';
import { APP_PROPOSAL } from '@deip/command-models';

const Schema = mongoose.Schema;

const ProposalDomainSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: true },
  "cmd": { type: Object, required: true },
  "status": { type: Number, required: true },
  "type": { type: Number, required: true },
  "requiredApprovals": { type: [String], required: true }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const writeModel = mongoose.model('wm-proposals', ProposalDomainSchema);

module.exports = writeModel;