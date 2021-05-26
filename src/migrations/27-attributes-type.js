require("@babel/register")({
  "presets": [
    [
      "@babel/env",
      {
        "targets": {
          "node": "current"
        }
      }
    ]
  ]
});

require("@babel/register")({
  "only": [
    function (filepath) {
      return filepath.includes("node_modules/@deip") || filepath.includes("node_modules/crc");
    },
  ]
});


const config = require('./../config');
const mongoose = require('mongoose');
const { ATTR_TYPES, ATTRIBUTE_SCOPE } = require('@deip/attributes-service');

const STEPPER = "stepper";
const TEXT = "text";
const TEXTAREA = "textarea";
const SELECT = "select";
const URL = "url";
const VIDEO_URL = "video-url";
const SWITCH = "switch";
const CHECKBOX = "checkbox";
const USER = "user";
const DISCIPLINE = "discipline";
const RESEARCH_GROUP = "research-group";

const IMAGE = "image";
const FILE = "file";
const EXPRESS_LICENSING = "express-licensing";
const NETWORK_CONTENT_ACCESS = "network-content-access";

const ROADMAP = "roadmap";
const PARTNERS = "partners";

const EDUCATION = "education";
const EMPLOYMENT = "employment";
const DATE = "date";

const LEGACY_ATTR_TYPES = {
  STEPPER,
  TEXT,
  TEXTAREA,
  SELECT,
  URL,
  VIDEO_URL,
  SWITCH,
  CHECKBOX,
  USER,
  DISCIPLINE,
  RESEARCH_GROUP,
  IMAGE,
  FILE,
  EXPRESS_LICENSING,
  NETWORK_CONTENT_ACCESS,
  ROADMAP,
  PARTNERS,
  EDUCATION,
  EMPLOYMENT,
  DATE
}


const Schema = mongoose.Schema;
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


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
    type: Schema.Types.Mixed,
    enum: [...Object.values(ATTR_TYPES)],
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

const AttributesRefs = mongoose.model('attributes', AttributeSchema);

const run = async () => {
  const attributesPromises = [];

  const attributesRefs = await AttributesRefs.find({});
  for (let i = 0; i < attributesRefs.length; i++) {
    const attributeRef = attributesRefs[i];
    const attributeRefObj = attributeRef.toObject();
    let type;

    switch (attributeRefObj.type) {

      case LEGACY_ATTR_TYPES.STEPPER: {
        type = ATTR_TYPES.STEPPER;
        break;
      }
      case LEGACY_ATTR_TYPES.TEXT: {
        type = ATTR_TYPES.TEXT;
        break;
      }
      case LEGACY_ATTR_TYPES.TEXTAREA: {
        type = ATTR_TYPES.TEXTAREA;
        break;
      }
      case LEGACY_ATTR_TYPES.SELECT: {
        type = ATTR_TYPES.SELECT;
        break;
      }
      case LEGACY_ATTR_TYPES.URL: {
        type = ATTR_TYPES.URL;
        break;
      }
      case LEGACY_ATTR_TYPES.VIDEO_URL: {
        type = ATTR_TYPES.VIDEO_URL;
        break;
      }
      case LEGACY_ATTR_TYPES.SWITCH: {
        type = ATTR_TYPES.SWITCH;
        break;
      }
      case LEGACY_ATTR_TYPES.SWITCH: {
        type = ATTR_TYPES.SWITCH;
        break;
      }
      case LEGACY_ATTR_TYPES.CHECKBOX: {
        type = ATTR_TYPES.CHECKBOX;
        break;
      }
      case LEGACY_ATTR_TYPES.USER: {
        type = ATTR_TYPES.USER;
        break;
      }
      case LEGACY_ATTR_TYPES.DISCIPLINE: {
        type = ATTR_TYPES.DISCIPLINE;
        break;
      }
      case LEGACY_ATTR_TYPES.RESEARCH_GROUP: {
        type = ATTR_TYPES.RESEARCH_GROUP;
        break;
      }
      case LEGACY_ATTR_TYPES.IMAGE: {
        type = ATTR_TYPES.IMAGE;
        break;
      }
      case LEGACY_ATTR_TYPES.FILE: {
        type = ATTR_TYPES.FILE;
        break;
      }
      case LEGACY_ATTR_TYPES.EXPRESS_LICENSING: {
        type = ATTR_TYPES.EXPRESS_LICENSING;
        break;
      }
      case LEGACY_ATTR_TYPES.NETWORK_CONTENT_ACCESS: {
        type = ATTR_TYPES.NETWORK_CONTENT_ACCESS;
        break;
      }
      case LEGACY_ATTR_TYPES.ROADMAP: {
        type = ATTR_TYPES.ROADMAP;
        break;
      }
      case LEGACY_ATTR_TYPES.PARTNERS: {
        type = ATTR_TYPES.PARTNERS;
        break;
      }
      case LEGACY_ATTR_TYPES.EDUCATION: {
        type = ATTR_TYPES.EDUCATION;
        break;
      }
      case LEGACY_ATTR_TYPES.EMPLOYMENT: {
        type = ATTR_TYPES.EMPLOYMENT;
        break;
      }
      case LEGACY_ATTR_TYPES.DATE: {
        type = ATTR_TYPES.DATE;
        break;
      }
      default:
        throw new Error("Unknown attribute type " + attributeRefObj.type);
    }

    attributeRef.type = type;

    attributesPromises.push(attributeRef.save());
  }

  await Promise.all(attributesPromises);
    
};

run()
  .then(() => {
    console.log('Successfully finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });