
import mongoose from 'mongoose';
import { APP_PROPOSAL } from '@deip/command-models';

const Schema = mongoose.Schema;

const ProposalSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: false /* temp */ },
  "cmd": { type: Object, required: false /* temp */ },
  "status": { type: Number, required: true },
  "type": { type: Number, required: true },
  "details": { type: Object, required: true }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('proposals', ProposalSchema);

module.exports = model;