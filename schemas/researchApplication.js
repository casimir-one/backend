
import mongoose from 'mongoose';
import { RESEARCH_APPLICATION_STATUS } from './../constants';

import ResearchCriteriaValue from './researchCriteriaValue';

const Schema = mongoose.Schema;

const ResearchApplication = new Schema({
  "_id": { type: String, trim: true, required: true },
  "researchExternalId": { type: String, trim: true, required: true },  
  "researcher": { type: String, trim: true, required: true },
  "status": { type: String, enum: [RESEARCH_APPLICATION_STATUS.PENDING, RESEARCH_APPLICATION_STATUS.APPROVED, RESEARCH_APPLICATION_STATUS.REJECTED], required: true },
  "title": { type: String, trim: true, required: true }, // Title
  "description": { type: String, trim: true, required: true }, // What is your idea, please describe
  "disciplines": [{ type: String, trim: true, required: true }], // Select your domain
  "problem": { type: String, trim: true, required: true }, // What are you trying to impact ?
  "solution": { type: String, trim: true, required: true }, // How will this solve the current problem ?
  "funding": { type: String, trim: true, required: true }, // How much funding are you expecting ?
  "eta": { type: String, trim: true, default: null }, // What is your project estimate ?
  "location": { // Project location
    "city": { type: String, trim: true, default: null },
    "country": { type: String, trim: true, default: null },
    "address": { type: String, trim: true, default: null }
  },
  "tenantCriterias": [ResearchCriteriaValue], // TRL, MaRL, SRL
  "budgetAttachment": { type: String, required: false, default: null }, // Submit your budget files, if any
  "businessPlanAttachment": { type: String, required: false, default: null }, // Submit your business plan, if any
  "cvAttachment": { type: String, required: false, default: null }, // Submit your resume/CV
  "marketResearchAttachment": { type: String, required: false, default: null }, // Submit all relevant market research documents
  "tx": { type: Object, required: true }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-applications', ResearchApplication);

module.exports = model;