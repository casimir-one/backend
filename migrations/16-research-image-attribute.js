require("babel-core/register")({
  "presets": [
    ["env", {
      "targets": {
        "node": true
      }
    }]
  ]
});
const config = require('./../config');

const mongoose = require('mongoose');
const bluebird = require('bluebird');
const TenantProfile = require('./../schemas/tenant');
const Research = require('./../schemas/research');

const deipRpc = require('@deip/rpc-client');
const RESEARCH_ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


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
    let tenant = tenants[i];
    tenant.settings.researchAttributes.push(researchCoverImageAttribute);
    tenantPromises.push(tenant.save());
  }
  
  const researchPromises = [];
  const researches = await Research.find({});
  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    
    research.attributes.push({
      value: "background.png",
      researchAttributeId: researchCoverImageAttribute._id
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


