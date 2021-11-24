
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ProposalSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: false /* temp */ },
  "cmd": { type: Object, required: false /* temp */ },
  "status": { type: Number, required: true },
  "type": { type: Number, required: true },
  "details": { type: Object, required: true },
  "decisionMakers": { type: Array, default: [] },
  "approvers": { type: Array, default: [] },
  "rejectors": { type: Array, default: [] },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('proposals', ProposalSchema);

module.exports = model;