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
  const MULTI_SELECT = "multi-select";

  const portalsPromises = [];
  const portals = await PortalProfile.find({});

  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];

    let projectDetailsRightSidebar = [];
    let projectCard = [];
    let projectDetailsMain = [];

    for (let j = 0; j < portalProfile.settings.projectAttributes.length; j++) {
      let projectAttribute = portalProfile.settings.projectAttributes[j];

      if (projectAttribute.type == ATTR_TYPES.STEPPER) {
        projectDetailsRightSidebar.push(projectAttribute._id);
        projectCard.push(projectAttribute._id)
      }

      if (projectAttribute.type == ATTR_TYPES.TEXT || projectAttribute.type == ATTR_TYPES.TEXTAREA) {
        projectDetailsMain.push(projectAttribute._id)
      }

      if (projectAttribute.type == ATTR_TYPES.SELECT || projectAttribute.type == MULTI_SELECT) {
        projectDetailsRightSidebar.push(projectAttribute._id);
      }

      if (projectAttribute.type == ATTR_TYPES.URL || projectAttribute.type == ATTR_TYPES.VIDEO_URL) {
        projectDetailsMain.push(projectAttribute._id);
      }

      if (projectAttribute.type == ATTR_TYPES.SWITCH || projectAttribute.type == ATTR_TYPES.CHECKBOX) {
        projectDetailsRightSidebar.push(projectAttribute._id);
        projectCard.push(projectAttribute._id)
      }

      if (projectAttribute.type == ATTR_TYPES.ROADMAP) {
        projectDetailsMain.push(projectAttribute._id);
      }

      if (projectAttribute.type == ATTR_TYPES.PARTNERS) {
        projectDetailsRightSidebar.push(projectAttribute._id);
      }
    }

    let projectAttributesAreas = {
      projectDetailsRightSidebar: projectDetailsRightSidebar,
      projectDetailsBody: projectDetailsMain,
      projectCard: projectCard,
      projectDetailsHeader: [],
      projectForm: []
    }

    portalProfile.settings.projectAttributesAreas = projectAttributesAreas;
    portalsPromises.push(portalProfile.save());
  }

  await Promise.all(portalsPromises);

  await PortalProfile.update({}, { $unset: { "settings.projectAttributes.$[].areas": "" } }, { multi: true });
  await PortalProfile.update({}, { $unset: { "settings.projectAttributes.$[].order": "" } }, { multi: true });

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


