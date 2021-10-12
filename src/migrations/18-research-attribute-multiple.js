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
const { ATTR_TYPES } = require('@deip/constants');



mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {

  const RESEARCH_GROUPS_LIST = "research-groups-list";
  const DISCIPLINES_LIST = "disciplines-list";
  const USERS_LIST = "users-list";
  const MULTI_SELECT = "multi-select";

  const tenantPromises = [];
  const tenants = await TenantProfile.find({});

  for (let i = 0; i < tenants.length; i++) {
    let tenantProfile = tenants[i];

    for (let j = 0; j < tenantProfile.settings.researchAttributes.length; j++) {
      let researchAttribute = tenantProfile.settings.researchAttributes[j];

      if (researchAttribute.type == RESEARCH_GROUPS_LIST ||
        researchAttribute.type == DISCIPLINES_LIST ||
        researchAttribute.type == USERS_LIST ||
        researchAttribute.type == MULTI_SELECT ||
        researchAttribute.type == ATTR_TYPES.URL) {

        researchAttribute.isMultiple = true;

        if (researchAttribute.type == RESEARCH_GROUPS_LIST) {
          researchAttribute.type = ATTR_TYPES.RESEARCH_GROUP;
        } else if (researchAttribute.type == DISCIPLINES_LIST) {
          researchAttribute.type = ATTR_TYPES.DISCIPLINE;
        } else if (researchAttribute.type == USERS_LIST) {
          researchAttribute.type = ATTR_TYPES.USER;
        } else if (researchAttribute.type == MULTI_SELECT) {
          researchAttribute.type = ATTR_TYPES.SELECT;
        }

      } else {
        researchAttribute.isMultiple = false;
      }

      researchAttribute.isPublished = undefined;
    }

    tenantPromises.push(tenantProfile.save());
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


