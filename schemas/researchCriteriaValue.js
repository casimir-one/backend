import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchCriteriaValue = new Schema({
  "_id": false,
  "component": { type: String, required: true },
  "value": { type: Object, required: false, default: null }
});

module.exports = ResearchCriteriaValue;