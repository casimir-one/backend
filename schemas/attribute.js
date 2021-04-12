import mongoose from 'mongoose';
import { RESEARCH_ATTRIBUTE_TYPE, ATTRIBUTE_SCOPE } from '../constants';


const Schema = mongoose.Schema;

const ResearchAttributeValueOption = new Schema({
  "_id": false,
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "value": { type: Schema.Types.ObjectId, default: null }
});

const BlockchainFieldMeta = new Schema({
  "_id": false,
  "field": { type: String, required: true },
  "isPartial": { type: Boolean, required: false, default: false }
});

const attribute = new Schema({
  "tenantId": { type: String, default: null },
  "isSystem": { type: Boolean, default: false },
  "type": {
    type: String,
    enum: [...Object.values(RESEARCH_ATTRIBUTE_TYPE)],
    required: true
  },
  "isFilterable": { type: Boolean, default: false },
  "isEditable": { type: Boolean, default: true },
  "isRequired": { type: Boolean, default: false },
  "isHidden": { type: Boolean, default: false },
  "isMultiple": { type: Boolean, default: false },
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "valueOptions": [ResearchAttributeValueOption],
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "blockchainFieldMeta": BlockchainFieldMeta,
  "scope": {
    type: Number,
    enum: [...Object.values(ATTRIBUTE_SCOPE)],
    required: true
  },

  "isPublished": { type: Boolean, required: false }, // temp for migration
  "isVisible": { type: Boolean, required: false }, // temp for migration
  "isBlockchainMeta": { type: Boolean, default: false }, // temp for migration
  "component": { type: Object, required: false } // temp for migration
});

const model = mongoose.model('attribute', attribute);

module.exports = model;
