
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "researchExternalId": { type: String, required: true },
  "researchContentExternalId": { type: String, required: true },
  "author": { type: String, required: true },
  "content": { type: String, required: true }
}, { timestamps: true });

const model = mongoose.model('reviews', ReviewSchema);

module.exports = model;