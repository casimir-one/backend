import { REVIEW_REQUEST_STATUS } from './../constants';
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ReviewRequestSchema = new Schema({
  "portalId": { type: String, required: true },
  "expert": { type: String, required: true, index: true },
  "requestor": { type: String, required: true },
  "projectContentId": { type: String, required: true },
  "status": {
    type: Number,
    enum: [...Object.values(REVIEW_REQUEST_STATUS)],
    required: true
  },
}, { timestamps: true });

const model = mongoose.model('review-request', ReviewRequestSchema);

module.exports = model;