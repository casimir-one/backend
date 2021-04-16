import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ResearchAttributeValue = new Schema({
  "_id": false,
  "researchAttributeId": { type: Schema.Types.ObjectId, required: false },
  "value": { type: Schema.Types.Mixed, default: null }
});


module.exports = ResearchAttributeValue;