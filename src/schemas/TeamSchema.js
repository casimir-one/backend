
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const TeamSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "researchAreas": [Object],

}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research-groups', TeamSchema);

module.exports = model;