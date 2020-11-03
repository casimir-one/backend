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
const RESEARCH_ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const run = async () => {
  const MULTI_SELECT = "multi-select";

  const tenantsPromises = [];
  const tenants = await TenantProfile.find({});

  for (let i = 0; i < tenants.length; i++) {
    let tenant = tenants[i];

    let researchDetailsRightSidebar = [];
    let researchCard = [];
    let researchDetailsMain = [];

    for (let j = 0; j < tenant.settings.researchAttributes.length; j++) {
      let researchAttribute = tenant.settings.researchAttributes[j];

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.STEPPER) {
        researchDetailsRightSidebar.push(researchAttribute._id);
        researchCard.push(researchAttribute._id)
      }

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.TEXT || researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.TEXTAREA) {
        researchDetailsMain.push(researchAttribute._id)
      }

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.SELECT || researchAttribute.type == MULTI_SELECT) {
        researchDetailsRightSidebar.push(researchAttribute._id);
      }

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.URL || researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.VIDEO_URL) {
        researchDetailsMain.push(researchAttribute._id);
      }

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.SWITCH || researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.CHECKBOX) {
        researchDetailsRightSidebar.push(researchAttribute._id);
        researchCard.push(researchAttribute._id)
      }

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.ROADMAP) {
        researchDetailsMain.push(researchAttribute._id);
      }

      if (researchAttribute.type == RESEARCH_ATTRIBUTE_TYPE.PARTNERS) {
        researchDetailsRightSidebar.push(researchAttribute._id);
      }
    }

    let researchAttributesAreas = {
      researchDetailsRightSidebar: researchDetailsRightSidebar,
      researchDetailsBody: researchDetailsMain,
      researchCard: researchCard,
      researchDetailsHeader: [],
      researchForm: []
    }

    tenant.settings.researchAttributesAreas = researchAttributesAreas;
    tenantsPromises.push(tenant.save());
  }

  await Promise.all(tenantsPromises);

  await TenantProfile.update({}, { $unset: { "settings.researchAttributes.$[].areas": "" } }, { multi: true });
  await TenantProfile.update({}, { $unset: { "settings.researchAttributes.$[].order": "" } }, { multi: true });

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


