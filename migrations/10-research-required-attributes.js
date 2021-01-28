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

const deipRpc = require('@deip/rpc-client');

deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  const tenantPromises = [];
  const tenants = await TenantProfile.find({});
  

  for (let i = 0; i < tenants.length; i++) {
    let tenant = tenants[i];
    
    for (let j = 0; j < tenant.settings.researchAttributes.length; j++) {
      let researchAttribute = tenant.settings.researchAttributes[j];
      if (researchAttribute.isBlockchainMeta) {
        researchAttribute.isRequired = true;
      } else {
        researchAttribute.isRequired = false;
      }
    }

    tenantPromises.push(tenant.save());
  }

  await Promise.all(tenantPromises);

  await TenantProfile.update({}, { $unset: { "settings.researchAttributes.$[].isEditable": "" } }, { multi: true });
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


