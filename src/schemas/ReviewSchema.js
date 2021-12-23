
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ReviewSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "projectContentId": { type: String, required: true },
  "author": { type: String, required: true },
  "content": { type: String, required: true }
}, { timestamps: true });

const model = mongoose.model('review', ReviewSchema);

module.exports = model;