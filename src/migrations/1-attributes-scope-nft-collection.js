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
      return filepath.includes("node_modules/@deip") || filepath.includes("node_modules/@casimir") || filepath.includes("node_modules/crc");
    },
  ]
});


// const config = require('./../config');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;
// mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);
mongoose.connect(''); //add DEIP_MONGO_STORAGE_CONNECTION_URL

const AttributeSchema = new Schema({
  "portalId": { type: String, default: null },
  "isSystem": { type: Boolean, default: false },
  "type": { type: Schema.Types.Mixed },
  "isFilterable": { type: Boolean, default: false },
  "isEditable": { type: Boolean, default: true },
  "isRequired": { type: Boolean, default: false },
  "isHidden": { type: Boolean, default: false },
  "isMultiple": { type: Boolean, default: false },
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "schemas": { type: Object, required: false, default: {} },
  "valueOptions": { type: Schema.Types.Mixed },
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "schemas": { type: Object, required: false, default: {} },
  "blockchainFieldMeta": { type: Schema.Types.Mixed },
  "scope": { type: Schema.Types.Mixed },
  "isGlobalScope": { type: Boolean, default: false }
});

const AttributesRefs = mongoose.model('attributes', AttributeSchema);

const run = async () => {
  const attributesPromises = [];

  const attributesRefs = await AttributesRefs.find({});
  for (let i = 0; i < attributesRefs.length; i++) {
    const attributeRef = attributesRefs[i];
    const attributeRefObj = attributeRef.toObject();
    if (attributeRefObj.scope === 'project') {
      attributeRef.scope = 'nftCollection';
      attributesPromises.push(attributeRef.save());
    }

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