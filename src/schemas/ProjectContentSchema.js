
import mongoose from 'mongoose';
import { PROJECT_CONTENT_FORMAT, RESEARCH_CONTENT_TYPES } from '@deip/constants';

const Schema = mongoose.Schema;

const ProjectContentSchema = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "researchExternalId": { type: String, required: true },
  "researchGroupExternalId": { type: String, required: true },
  "folder": { type: String, required: true },
  "researchId": { type: Number}, // legacy internal id
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "contentType": {
    type: Number,
    enum: [...Object.values(RESEARCH_CONTENT_TYPES)],
    required: true
  },
  "formatType": {
    type: Number,
    enum: [...Object.values(PROJECT_CONTENT_FORMAT)],
    required: true
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "jsonData": { type: Object },
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
}, { timestamps: true });

const model = mongoose.model('research-content', ProjectContentSchema);

module.exports = model;