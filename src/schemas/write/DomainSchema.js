
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DomainSchema = new Schema({
  "_id": { type: String, required: true },
  "parentExternalId": { type: String, required: false },
  "name": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "multiTenantIds": { type: [String] }
});

const model = mongoose.model('discipline', DomainSchema);

module.exports = model;