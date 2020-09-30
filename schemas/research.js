
import mongoose from 'mongoose';
import ResearchAttributeValue from './researchAttributeValue';
import ResearchCategoryValue from './researchCategoryValue';
import { RESEARCH_STATUS } from './../constants';

const Schema = mongoose.Schema;

const Research = new Schema({
  "_id": { type: String, required: true },
  "researchGroupExternalId": { type: String, required: true },
  "attributes": [ResearchAttributeValue],
  "status": { type: String, enum: [...Object.values(RESEARCH_STATUS)], required: false },



  /* === TEMP FOR MIGRATION === */
  "researchGroupId": { type: Number, required: false }, // legacy internal id

  "title": { type: String, required: false },
  "abstract": { type: String, required: false, default: "" },
  "tenantCategory": ResearchCategoryValue,
  "videoSrc": { type: String, default: null },
  "tenantCriterias": [ResearchAttributeValue],
  "milestones": [{
    "_id": false,
    "goal": { type: String, required: false },
    "budget": { type: String, defaul: null },
    "purpose": { type: String, defaul: null },
    "details": { type: String, default: null },
    "eta": { type: Date, required: false },
    "isActive": { type: Boolean, default: false },
  }],
  "partners": [{
    "_id": false,
    "type": { type: String, required: false },
    "title": { type: String, required: false }
  }]
  /* === TEMP FOR MIGRATION === */
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

Research.index({ custom_id: 1 }, { unique: true, sparse: true });

const model = mongoose.model('research', Research);

module.exports = model;