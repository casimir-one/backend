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
const RESEARCH_ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;

const deipRpc = require('@deip/rpc-client');

deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  const tenantPromises = [];
  const tenants = await TenantProfile.find({});
  
  for (let i = 0; i < tenants.length; i++) {
    let tenantProfile = tenants[i];
    
    for (let j = 0; j < tenantProfile.settings.researchAttributes.length; j++) {
      let researchAttribute = tenantProfile.settings.researchAttributes[j];
      if (researchAttribute.isBlockchainMeta) {
        researchAttribute.blockchainFieldMeta = {
          field: researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.TEXT ? 'title' : 'abstract',
          isPartial: false
        }
      } else {
        researchAttribute.blockchainFieldMeta = null;
      }
    }

    tenantPromises.push(tenantProfile.save());
  }

  await Promise.all(tenantPromises);

  await TenantProfile.update({}, { $unset: { "settings.researchAttributes.$[].isBlockchainMeta": "" } }, { multi: true });
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


