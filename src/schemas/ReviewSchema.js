
import mongoose from 'mongoose';
import { ASSESSMENT_CRITERIA_TYPE } from '@deip/constants';

const Schema = mongoose.Schema;

const assessmentSchema = new Schema({
  "_id": false,
  "scores": { type: Object, required: false },
  "type": { type: Number, enum: [...Object.values(ASSESSMENT_CRITERIA_TYPE)], required: true },
  "isPositive": { type: Boolean, required: false }
});

const ReviewSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "projectContentId": { type: String, required: true },
  "author": { type: String, required: true },
  "content": { type: String, required: true },
  "assessment": assessmentSchema,
  "domains": { type: [String], required: true }
}, { timestamps: true });

const model = mongoose.model('review', ReviewSchema);

module.exports = model;