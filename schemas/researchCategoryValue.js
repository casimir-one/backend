import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchCategoryValue = new Schema({
  "text": { type: Object, required: false, default: null }
});

module.exports = ResearchCategoryValue;