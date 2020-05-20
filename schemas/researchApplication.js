
import mongoose from 'mongoose';
import { RESEARCH_APPLICATION_STATUS } from './../constants';

import ResearchCriteriaValue from './researchCriteriaValue';

const Schema = mongoose.Schema;

const ResearchApplication = new Schema({
  "_id": { type: String, required: true },
  "researcher": { type: String, required: true },
  "status": { type: String, enum: [RESEARCH_APPLICATION_STATUS.PENDING, RESEARCH_APPLICATION_STATUS.APPROVED, RESEARCH_APPLICATION_STATUS.REJECTED], required: true },
  "title": { type: String, required: true },
  "abstract": { type: String, required: true },
  "disciplines": [{ type: String, required: true }],
  "location": {
    "city": { type: String, trim: true, default: null },
    "country": { type: String, trim: true, default: null },
    "address": { type: String, trim: true, default: null }
  },
  "problem": { type: String, required: true },
  "solution": { type: String, required: true },
  "tenantCriterias": [ResearchCriteriaValue],
  "eta": { type: Date, default: null },
  "cvAttachment": { type: String, required: true },
  "marketResearchAttachment": { type: String, required: true },
  "fundingAttachment": { type: String, required: true },
  "budgetAttachment": { type: String, required: true },
  "businessPlanAttachment": { type: String, required: true }

}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-applications', ResearchApplication);

module.exports = model;