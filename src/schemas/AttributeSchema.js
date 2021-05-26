import mongoose from 'mongoose';
import { ATTRIBUTE_TYPE, ATTRIBUTE_SCOPE } from './../constants';


const Schema = mongoose.Schema;


const AttributeValueOption = new Schema({
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

const AttributeSchema = new Schema({
  "tenantId": { type: String, default: null },
  "isSystem": { type: Boolean, default: false },
  "type": {
    type: Number,
    enum: [...Object.values(ATTRIBUTE_TYPE)],
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
  "schemas": { type: Object, required: false, default: {} },
  "valueOptions": [AttributeValueOption],
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "blockchainFieldMeta": BlockchainFieldMeta,
  "scope": {
    type: Number,
    enum: [...Object.values(ATTRIBUTE_SCOPE)],
    required: true
  }
});

const model = mongoose.model('attribute', AttributeSchema);

module.exports = model;
