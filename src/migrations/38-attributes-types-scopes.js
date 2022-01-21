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

const ATTR_TYPES = {
  1: 'text',
  2: 'textarea',
  3: 'select',
  4: 'switch',
  5: 'checkbox',
  6: 'date',
  7: 'dateTime',
  8: 'file',
  9: 'image',
  10: 'url',
  11: 'number',
  12: 'videoUrl',
  13: 'userSelect', // feature
  14: 'avatar',
  15: 'location',
  16: 'richText',
  501: 'stepper', // feature
  502: 'domain', // feature
  503: 'teamSelect', // feature
  504: 'expressLicensing', // feature
  505: 'networkContentAccess', // feature
  506: 'roadmap', // custom
  507: 'partners', // custom
  508: 'education', // custom
  509: 'employment', // custom
  1001: 'custom'
};

const ATTR_SCOPES = {
  1: 'project',
  2: 'user',
  3: 'team'
};

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
  "portalId": { type: String, default: null },
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
  "schemas": { type: Object, required: false, default: {} },
  "blockchainFieldMeta": BlockchainFieldMeta,
  "scope": {
    type: Schema.Types.Mixed,
    enum: [...Object.values(ATTR_SCOPES)],
    required: true
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const AttributesRefs = mongoose.model('attributes', AttributeSchema);

const run = async () => {
  const attributesPromises = [];

  const attributesRefs = await AttributesRefs.find({});
  for (let i = 0; i < attributesRefs.length; i++) {
    const attributeRef = attributesRefs[i];
    const attributeRefObj = attributeRef.toObject();
    let type = ATTR_TYPES[attributeRefObj.type];
    let scope = ATTR_SCOPES[attributeRefObj.scope];

    attributeRef.type = type;
    attributeRef.scope = scope;

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