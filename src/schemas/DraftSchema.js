
import mongoose from 'mongoose';
import { PROJECT_CONTENT_STATUS } from '../constants';

const Schema = mongoose.Schema;

const DraftSchema = new Schema({
  "tenantId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "folder": { type: String, required: true },
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
    enum: [...Object.values(PROJECT_CONTENT_STATUS)],
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

const model = mongoose.model('draft', DraftSchema);

module.exports = model;