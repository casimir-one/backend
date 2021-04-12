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

const systemAttributes = ['5f68be39c579c726e93a3006','5f68be39c579c726e93a3007','5f62d4fa98f46d2938dde1eb','5f68d4fa98f36d2938dde5ec','5f690af5cdaaa53a27af4a30','5f6f34a0b1655909aba2398b','5f7ec161fbb737001f1bacf1','5f69be12ae115a26e475fb96','5f690af5cdaaa53a27af4a31','5f68d4fa98f36d2938dde5ed'];

const config = require('./../config');

const mongoose = require('mongoose');
const Attribute = require('./../schemas/attribute');
const TenantProfile = require('./../schemas/tenant');
const ATTRIBUTE_SCOPE = require('../constants').ATTRIBUTE_SCOPE;

const deipRpc = require('@deip/rpc-client');

deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const tenantProfiles = await TenantProfile.find({}).lean();

  const researchAttributesPromises = [];

  tenantProfiles[0].settings.researchAttributes.forEach(attr => {
    if(systemAttributes.includes(attr._id.toString())) {
      const researchAttribute = new Attribute({
        tenantId: null,
        isSystem: true,
        scope: ATTRIBUTE_SCOPE.RESEARCH,
        ...attr
      });
      
      researchAttributesPromises.push(researchAttribute.save());
    }
  })

  for (let i = 0; i < tenantProfiles.length; i++) {
    [...tenantProfiles[i].settings.researchAttributes].forEach((attr) => {
      if(!systemAttributes.includes(attr._id.toString())) {
        delete attr._id;
        const researchAttribute = new Attribute({
          tenantId: tenantProfiles[i]._id,
          isSystem: false,
          scope: ATTRIBUTE_SCOPE.RESEARCH,
          ...attr
        });
        
        researchAttributesPromises.push(researchAttribute.save());
      }
    })
  }

  await Promise.all(researchAttributesPromises);
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