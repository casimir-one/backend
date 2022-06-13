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
  const TEAMS_LIST = "teams-list";

  const portalPromises = [];
  const portals = await PortalProfile.find({});

  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];

    portalProfile.projectCategories = undefined;
    portalProfile.projectComponents = undefined;

    for (let j = 0; j < portalProfile.settings.projectAttributes.length; j++) {
      let projectAttribute = portalProfile.settings.projectAttributes[j];

      projectAttribute.isPublished = projectAttribute.isVisible;

      projectAttribute.isVisible = undefined
      projectAttribute.isBlockchainMeta = undefined;
      projectAttribute.component = undefined;

      if (projectAttribute.type == TEAMS_LIST || projectAttribute.type == ATTR_TYPES.TEAM) {
        projectAttribute.isHidden = true;
      } else {
        projectAttribute.isHidden = false;
      }
    }

    for (let j = 0; j < portalProfile.settings.faq.length; j++) {
      let qa = portalProfile.settings.faq[j];
      qa.isPublished = qa.isVisible;
      qa.isVisible = undefined;
    }

    portalPromises.push(portalProfile.save());
  }

  await Promise.all(portalPromises);

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


