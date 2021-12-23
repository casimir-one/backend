
import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';
import { PROJECT_STATUS } from './../constants';

const Schema = mongoose.Schema;

const ProjectSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "status": { type: Number, enum: [...Object.values(PROJECT_STATUS)], required: false },
  "isDefault": { type: Boolean, default: false }
}, { timestamps: true });

const model = mongoose.model('project', ProjectSchema);

module.exports = model;