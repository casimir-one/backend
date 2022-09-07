import mongoose from 'mongoose';
import { AttributeScope } from '@casimir.one/platform-core';
const Schema = mongoose.Schema;

const LayoutSchema = new Schema({
  "portalId": { type: String, required: true },
  "name": { type: String, required: true },
  "value": { type: Array, required: true },
  "scope": { type: String, enum: Object.values(AttributeScope), required: true },
  "type": { type: String, required: true }
}, { timestamps: true });

const model = mongoose.model('layout', LayoutSchema);

module.exports = model;
