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

  for (let i = 0; i < tenants.length; i++) {
    let tenant = tenants[i];

    tenant.researchCategories = undefined;
    tenant.researchComponents = undefined;

    for (let j = 0; j < tenant.settings.researchAttributes.length; j++) {
      let researchAttribute = tenant.settings.researchAttributes[j];

      researchAttribute.isPublished = researchAttribute.isVisible;

      researchAttribute.isVisible = undefined
      researchAttribute.isBlockchainMeta = undefined;
      researchAttribute.component = undefined;

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUPS_LIST || researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP) {
        researchAttribute.isHidden = true;
      } else {
        researchAttribute.isHidden = false;
      }

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.DISCIPLINES_LIST || researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.DISCIPLINE || researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUPS_LIST || researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP) {
        researchAttribute.isEditable = false;
      } else {
        researchAttribute.isEditable = true;
      }
    }

    for (let j = 0; j < tenant.settings.faq.length; j++) {
      let qa = tenant.settings.faq[j];
      qa.isPublished = qa.isVisible;
      qa.isVisible = undefined;
    }

    tenantPromises.push(tenant.save());
  }

  await Promise.all(tenantPromises);

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


