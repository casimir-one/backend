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
  const USERS_LIST = "users-list";
  const MULTI_SELECT = "multi-select";

  const portalPromises = [];
  const portals = await PortalProfile.find({});

  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];

    for (let j = 0; j < portalProfile.settings.projectAttributes.length; j++) {
      let projectAttribute = portalProfile.settings.projectAttributes[j];

      if (projectAttribute.type == TEAMS_LIST ||
        projectAttribute.type == USERS_LIST ||
        projectAttribute.type == MULTI_SELECT ||
        projectAttribute.type == ATTR_TYPES.URL) {

        projectAttribute.isMultiple = true;

        if (projectAttribute.type == TEAMS_LIST) {
          projectAttribute.type = ATTR_TYPES.TEAM;
        } else if (projectAttribute.type == USERS_LIST) {
          projectAttribute.type = ATTR_TYPES.USER;
        } else if (projectAttribute.type == MULTI_SELECT) {
          projectAttribute.type = ATTR_TYPES.SELECT;
        }

      } else {
        projectAttribute.isMultiple = false;
      }

      projectAttribute.isPublished = undefined;
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


