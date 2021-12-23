
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const AwardWithdrawalRequestSchema = new Schema({
  "portalId": { type: String, required: true },
  "filename": { type: String, required: true },
  "folder": { type: String, required: false },
  "projectId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "paymentNumber": { type: String, required: true },
  "awardNumber": { type: String, required: true },
  "subawardNumber": { type: String, required: true },
  "hash": { type: String, index: true },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
}, { timestamps: true });


AwardWithdrawalRequestSchema.index({ awardNumber: 1, paymentNumber: 1 }, { unique: true });

const model = mongoose.model('award-withdrawal-request', AwardWithdrawalRequestSchema);

module.exports = model;