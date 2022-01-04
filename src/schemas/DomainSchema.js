
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DomainSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: false },
  "parentId": { type: String, required: false },
  "name": { type: String, required: true },
  "isGlobalScope": { type: Boolean, default: true }
});

const model = mongoose.model('domain', DomainSchema);

module.exports = model;