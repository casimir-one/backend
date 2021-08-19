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
const TenantProfile = require('./../schemas/tenant');
const ATTRIBUTE_TYPE = require('./../constants/attributeTypes').default;


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
          field: researchAttribute.type == ATTRIBUTE_TYPE.TEXT ? 'title' : 'abstract',
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


