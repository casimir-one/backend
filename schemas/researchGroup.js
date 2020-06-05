
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchArea = new Schema({
  "_id": false,
  "id": { type: String, required: true },
  "parentId": { type: String },
  "title": { type: String, required: true },
  "disciplines": [{ type: String, required: true }],
});

const ResearchGroup = new Schema({
  "_id": { type: String, required: true },
  "creator": { type: String, required: true },
  "researchAreas": [ResearchArea],

}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-groups', ResearchGroup);

module.exports = model;