
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const Discipline = new Schema({
  "_id": { type: String, required: true },
  "parentExternalId": { type: String, required: false },
  "name": { type: String, required: true },
  "tenantId": { type: String, required: true }
});

const model = mongoose.model('discipline', Discipline);

module.exports = model;