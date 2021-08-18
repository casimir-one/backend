import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const FundraisingSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "title": { type: String },
  "details": { type: Object }
});

const model = mongoose.model('fundraising', FundraisingSchema);

module.exports = model;