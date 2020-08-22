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
const Research = require('./../schemas/research');

const deipRpc = require('@deip/rpc-client');
const RESEARCH_COMPONENT_TYPE = require('./../constants/researchComponentsTypes').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const run = async () => {

  await Research.update({}, { $rename: { tenantCriterias: "attributes" } }, { multi: true });
  await TenantProfile.update({}, { $rename: { "settings.researchComponents": "settings.researchAttributes" } }, { multi: true });

  let tenantPromises = [];
  let allResearchAttributes = [];

  const tenants = await TenantProfile.find({});
  
  for (let i = 0; i < tenants.length; i++) {
    let tenant = tenants[i];

    let researchAttributes = [];
    for (let j = 0; j < tenant.settings.researchAttributes.length; j++) {
      let researchAttribute = tenant.settings.researchAttributes[j];
      let attribute = {
        _id: researchAttribute._id,
        type: researchAttribute.type,
        isVisible: researchAttribute.isVisible,
        title: researchAttribute.type == RESEARCH_COMPONENT_TYPE.STEPPER ? researchAttribute.component.readinessLevelTitle : '',
        shortTitle: researchAttribute.type == RESEARCH_COMPONENT_TYPE.STEPPER ? researchAttribute.component.readinessLevelShortTitle : '',
        description: '',
        valueOptions: researchAttribute.type == RESEARCH_COMPONENT_TYPE.STEPPER ? researchAttribute.component.readinessLevels.map(rl => {
          return {
            title: rl.title,
            shortTitle: '',
            description: rl.description,
            value: mongoose.Types.ObjectId()
          }
        }) : [],
        defaultValue: null
      };
      researchAttributes.push(attribute);
    }

    tenant.settings.researchAttributes = researchAttributes;
    tenantPromises.push(tenant.save());
    allResearchAttributes.push(...researchAttributes)
  }

  await Promise.all(tenantPromises);
  
  const researches = await Research.find({});
  let researchPromises = [];

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];

    let trlAttribute = allResearchAttributes.find(a => a._id.toString() == mongoose.Types.ObjectId("5ebd469a2cea71001f84345a").toString());
    let marlAttribute = allResearchAttributes.find(a => a._id.toString() == mongoose.Types.ObjectId("5ebd47762cea71001f843460").toString());
    let srlAttribute = allResearchAttributes.find(a => a._id.toString() == mongoose.Types.ObjectId("5ebd4b842cea71001f843467").toString());


    let trlValue = research.attributes.find(a => a.component.toString() == trlAttribute._id.toString());
    let marlValue = research.attributes.find(a => a.component.toString() == marlAttribute._id.toString());
    let srlValue = research.attributes.find(a => a.component.toString() == srlAttribute._id.toString());

    let researchTenantCriterias = [];

    if (trlAttribute && trlValue) {
      researchTenantCriterias.push({ researchAttributeId: mongoose.Types.ObjectId(trlValue.component.toString()), type: trlValue.type, value: trlAttribute.valueOptions[trlValue.value.index].value });
    }

    if (marlAttribute && marlValue) {
      researchTenantCriterias.push({ researchAttributeId: mongoose.Types.ObjectId(marlValue.component.toString()), type: marlValue.type, value: marlAttribute.valueOptions[marlValue.value.index].value });
    }

    if (srlAttribute && srlValue) {
      researchTenantCriterias.push({ researchAttributeId: mongoose.Types.ObjectId(srlValue.component.toString()), type: srlValue.type, value: srlAttribute.valueOptions[srlValue.value.index].value })
    }

    research.attributes = researchTenantCriterias;

    researchPromises.push(research.save());
  }

  await Promise.all(researchPromises);

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


