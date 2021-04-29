
import mongoose from 'mongoose';
import { RESEARCH_CONTENT_STATUS } from './../../constants';

const Schema = mongoose.Schema;

const ProjectContentSchema = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "researchExternalId": { type: String, required: true },
  "researchGroupExternalId": { type: String, required: true },
  "folder": { type: String, required: true },
  "researchId": { type: Number, required: true }, // legacy internal id
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "type": {
    type: String,
    enum: ['file', 'dar', 'package'],
    required: true
  },
  "status": {
    type: String,
    enum: [...Object.values(RESEARCH_CONTENT_STATUS)],
    required: true
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-content', ProjectContentSchema);

module.exports = model;