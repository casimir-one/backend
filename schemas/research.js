
import mongoose from 'mongoose';
import ResearchAttributeValue from './researchAttributeValue';
import ResearchCategoryValue from './researchCategoryValue';

const Schema = mongoose.Schema;

const Research = new Schema({
  "_id": { type: String, required: true },
  "researchGroupExternalId": { type: String, required: true },
  "researchGroupId": { type: Number, required: true }, // legacy internal id
  "attributes": [ResearchAttributeValue],
  "customId": { type: String, required: false },


  /* === TEMP FOR MIGRATION === */
  "tenantCategory": ResearchCategoryValue,
  "videoSrc": { type: String, default: null },
  "tenantCriterias": [ResearchAttributeValue],
  "milestones": [{
    "_id": false,
    "goal": { type: String, required: true },
    "budget": { type: String, defaul: null },
    "purpose": { type: String, defaul: null },
    "details": { type: String, default: null },
    "eta": { type: Date, required: true },
    "isActive": { type: Boolean, default: false },
  }],
  "partners": [{
    "_id": false,
    "type": { type: String, required: true },
    "title": { type: String, required: true }
  }]
  /* === TEMP FOR MIGRATION === */
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

Research.index({ custom_id: 1 }, { unique: true, sparse: true });

const model = mongoose.model('research', Research);

module.exports = model;