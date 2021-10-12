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
const AttributeSchema = require('./../schemas/AttributeSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const attributesPromises = [];

  const attributes = await AttributeSchema.find({});

  for (let i = 0; i < attributes.length; i++) {
    const attribute = attributes[i];
    const attributeObj = attribute.toObject();
    attribute.isGlobalScope = attributeObj.tenantId ? false : true;
    attributesPromises.push(attribute.save());
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