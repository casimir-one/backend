
import mongoose from 'mongoose';

const Schema = mongoose.Schema;


const ResearchGroup = new Schema({
  "_id": { type: String, required: true },
  "creator": { type: String, required: true },
  "name": { type: String, required: true },
  "description": { type: String, required: false, default: "" },
  "researchAreas": [Object],

}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-groups', ResearchGroup);

module.exports = model;