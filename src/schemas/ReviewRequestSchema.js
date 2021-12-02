import { REVIEW_REQUEST_STATUS } from './../constants';
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ReviewRequestSchema = new Schema({
  "tenantId": { type: String, required: true },
  "expert": { type: String, required: true, index: true },
  "requestor": { type: String, required: true },
  "projectContentId": { type: String, required: true },
  "status": {
    type: Number,
    enum: [...Object.values(REVIEW_REQUEST_STATUS)],
    required: true
  },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('review-requests', ReviewRequestSchema);

module.exports = model;