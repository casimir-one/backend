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
  
  const tenantPromises = [];
  const tenants = await TenantProfile.find({});

  const researchCoverImageAttribute = {
    _id: mongoose.Types.ObjectId("5f58d4fa97f36d3938dde1ed"),
    type: RESEARCH_ATTRIBUTE_TYPE.IMAGE,
    isPublished: true,
    isHidden: false,
    isRequired: false,
    isFilterable: false,
    isEditable: true,
    title: "Cover image",
    shortTitle: "Cover image",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: null
  };

  
  for (let i = 0; i < tenants.length; i++) {
    let tenantProfile = tenants[i];
    tenantProfile.settings.researchAttributes.push(researchCoverImageAttribute);
    tenantPromises.push(tenantProfile.save());
  }
  
  const researchPromises = [];
  const researches = await Research.find({});
  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    
    research.attributes.push({
      value: "background.png",
      attributeId: researchCoverImageAttribute._id
    });

    researchPromises.push(research.save());
  }

  await Promise.all(tenantPromises);
  await Promise.all(researchPromises);

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


