import mongoose from 'mongoose';
import { ATTR_SCOPES } from '@deip/constants';

const Schema = mongoose.Schema;

const LayoutSchema = new Schema({
  "portalId": { type: String, required: true },
  "name": { type: String, required: true },
  "value": { type: Array, required: true },
  "scope": { type: String, enum: [...Object.values(ATTR_SCOPES)], required: true },
  "type": { type: String, required: true }
}, { timestamps: true });

const model = mongoose.model('layout', LayoutSchema);

module.exports = model;
