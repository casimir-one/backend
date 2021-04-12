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

const config = require('./../config');

const mongoose = require('mongoose');
const bluebird = require('bluebird');
const TenantProfile = require('./../schemas/tenant');
const Research = require('./../schemas/research');

const deipRpc = require('@deip/rpc-client');
const RESEARCH_ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;


deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  await TenantProfile.update({}, { $set: { "settings.researchAttributes.$[].isBlockchainMeta": false } }, { multi: true });

  const tenantPromises = [];
  const tenants = await TenantProfile.find({});
  
  const researchTitleAttribute = {
    _id: mongoose.Types.ObjectId("5f68be39c579c726e93a3006"),
    type: RESEARCH_ATTRIBUTE_TYPE.TEXT,
    isVisible: true,
    isEditable: false,
    isFilterable: false,
    isBlockchainMeta: true,
    title: "Title",
    shortTitle: "Title",
    description: "",
    valueOptions: [],
    defaultValue: null
  };


  const researchDescriptionAttribute = {
    _id: mongoose.Types.ObjectId("5f68be39c579c726e93a3007"),
    type: RESEARCH_ATTRIBUTE_TYPE.TEXTAREA,
    isVisible: true,
    isEditable: false,
    isFilterable: false,
    isBlockchainMeta: true,
    title: "Description",
    shortTitle: "Description",
    description: "",
    valueOptions: [],
    defaultValue: null
  };


  for (let i = 0; i < tenants.length; i++) {
    let tenantProfile = tenants[i];

    tenantProfile.settings.researchAttributes.push(researchTitleAttribute);
    tenantProfile.settings.researchAttributes.push(researchDescriptionAttribute);
    
    tenantPromises.push(tenantProfile.save());
  }
  
  
  const researchPromises = [];
  const researches = await Research.find({});

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    
    research.attributes.push({
      value: research.title,
      researchAttributeId: researchTitleAttribute._id
    });

    research.attributes.push({
      value: research.abstract,
      researchAttributeId: researchDescriptionAttribute._id
    });

    researchPromises.push(research.save());
  }

  await Promise.all(tenantPromises);
  await Promise.all(researchPromises);

  await Research.update({}, { $unset: { "title": false } }, { multi: true });
  await Research.update({}, { $unset: { "abstract": false } }, { multi: true });

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


