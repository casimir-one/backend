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
const PortalProfile = require('./../schemas/PortalSchema');
const { ATTR_TYPES } = require('@deip/constants');


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  const portalPromises = [];
  const portals = await PortalProfile.find({});
  
  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];
    
    for (let j = 0; j < portalProfile.settings.projectAttributes.length; j++) {
      let projectAttribute = portalProfile.settings.projectAttributes[j];
      if (projectAttribute.isBlockchainMeta) {
        projectAttribute.blockchainFieldMeta = {
          field: projectAttribute.type == ATTR_TYPES.TEXT ? 'title' : 'abstract',
          isPartial: false
        }
      } else {
        projectAttribute.blockchainFieldMeta = null;
      }
    }

    portalPromises.push(portalProfile.save());
  }

  await Promise.all(portalPromises);

  await PortalProfile.update({}, { $unset: { "settings.projectAttributes.$[].isBlockchainMeta": "" } }, { multi: true });
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


