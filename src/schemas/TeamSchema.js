import mongoose from 'mongoose';
import AttributeValueSchema from './AttributeValueSchema';

const Schema = mongoose.Schema;

const TeamSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "address": { type: String, required: false },
  "creator": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "members": { type: [String], required: true },
  "isPortalTeam": { type: Boolean, default: false }
}, { timestamps: true });

const model = mongoose.model('teams-dao', TeamSchema);

module.exports = model;
