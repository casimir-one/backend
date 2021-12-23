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

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  const portalPromises = [];
  const portals = await PortalProfile.find({});
  

  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];
    
    for (let j = 0; j < portalProfile.settings.projectAttributes.length; j++) {
      let projectAttribute = portalProfile.settings.projectAttributes[j];
      if (projectAttribute.isBlockchainMeta) {
        projectAttribute.isRequired = true;
      } else {
        projectAttribute.isRequired = false;
      }
    }

    portalPromises.push(portalProfile.save());
  }

  await Promise.all(portalPromises);

  await PortalProfile.update({}, { $unset: { "settings.projectAttributes.$[].isEditable": "" } }, { multi: true });
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


