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

const LayoutSchema = new Schema({
  "portalId": { type: String, required: true },
  "name": { type: String, required: true },
  "value": { type: Array, required: true },
  "scope": { type: Schema.Types.Mixed },
  "type": { type: String, required: true }
}, { timestamps: true });

const PortalSchema = new Schema({
  "_id": { type: String },
  "name": { type: String },
  "serverUrl": { type: String, required: true },
  "shortName": { type: String },
  "description": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "logo": { type: String, default: "default_portal_logo.png" },
  "banner": { type: String, default: "default_banner_logo.png" },
  "network": { type: Schema.Types.Mixed },
  "settings": {
    "signUpPolicy": { type: Schema.Types.Mixed },
    "attributeOverwrites": { type: Schema.Types.Mixed },
    "attributeSettings": { type: Object },
    "layoutSettings": { type: Object },
    "layouts": { type: Schema.Types.Mixed },
    "faq": { type: Schema.Types.Mixed },
    "theme": { type: Object },
    "modules": { type: Schema.Types.Mixed },
    "roles": { type: Schema.Types.Mixed },
    "moderation": { type: Schema.Types.Mixed }
  }
}, { timestamps: true, minimize: false });


const LayoutSchemaRefs = mongoose.model('layout', LayoutSchema);
const AttributesRefs = mongoose.model('attributes', AttributeSchema);
const PortalsRefs = mongoose.model('portal', PortalSchema);

const run = async () => {
  const attributesPromises = [];
  const layoutsPromises = [];
  const portalsPromises = [];

  const attributesRefs = await AttributesRefs.find({});
  for (let i = 0; i < attributesRefs.length; i++) {
    const attributeRef = attributesRefs[i];
    const attributeRefObj = attributeRef.toObject();
    if (attributeRefObj.scope === 'project') {
      attributeRef.scope = 'nftCollection';
      attributesPromises.push(attributeRef.save());
    }
  }

  const layoutSchemaRefs = await LayoutSchemaRefs.find({});
  for (let i = 0; i < layoutSchemaRefs.length; i++) {
    const layoutRef = layoutSchemaRefs[i];
    const layoutRefObj = layoutRef.toObject();
    if (layoutRefObj.scope === 'project') {
      layoutRef.scope = 'nftCollection';
      layoutsPromises.push(layoutRef.save());
    }
  }

  const portalsRefs = await PortalsRefs.find({});
  for (let i = 0; i < portalsRefs.length; i++) {
    const portalRef = portalsRefs[i];
    const portalRefObj = portalRef.toObject();
    if(portalRefObj.settings?.attributeSettings?.mappedKeys?.length) {
      portalRefObj.settings.attributeSettings.mappedKeys.forEach((item, index) => {
        if (item?.key?.includes('project.')) {
          item.key = item.key.replace('project.', 'nftCollection.')
        }
      })
      portalRef.settings.attributeSettings = portalRefObj.settings.attributeSettings
    }
    portalsPromises.push(portalRef.save());
  }

  await Promise.all(attributesPromises);
  await Promise.all(layoutsPromises);
  await Promise.all(portalsPromises);
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