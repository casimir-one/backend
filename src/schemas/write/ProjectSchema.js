
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';
import { RESEARCH_STATUS } from './../../constants';

const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "researchGroupExternalId": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "status": { type: String, enum: [...Object.values(RESEARCH_STATUS)], required: false },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const model = mongoose.model('research', ProjectSchema);

module.exports = model;