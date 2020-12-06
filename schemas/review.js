
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Review = new Schema({
  "_id": { type: String, required: true },
  "researchContentExternalId": { type: String, required: true },
  "author": { type: String, required: true },
  "content": { type: String, required: true }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('reviews', Review);

module.exports = model;