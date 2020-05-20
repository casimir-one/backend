import mongoose from 'mongoose';
import { RESEARCH_COMPONENT_TYPE } from './../constants';

const Schema = mongoose.Schema;

const ResearchCriteriaValue = new Schema({
  "_id": false,
  "type": { type: String, enum: [RESEARCH_COMPONENT_TYPE.STEPPER], required: true },
  "component": { type: String, required: true },
  "value": { type: Object, required: false, default: null }
});

module.exports = ResearchCriteriaValue;