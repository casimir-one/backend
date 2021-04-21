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
const bluebird = require('bluebird');
const TenantProfile = require('./../schemas/tenant');
const Research = require('./../schemas/research');

const deipRpc = require('@deip/rpc-client');
const ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;


deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {

  await Research.update({}, { $rename: { tenantCriterias: "attributes" } }, { multi: true });
  await TenantProfile.update({}, { $rename: { "settings.researchComponents": "settings.researchAttributes" } }, { multi: true });

  let tenantPromises = [];
  let allResearchAttributes = [];

  const tenants = await TenantProfile.find({});
  
  for (let i = 0; i < tenants.length; i++) {
    let tenantProfile = tenants[i];

    let researchAttributes = [];
    for (let j = 0; j < tenantProfile.settings.researchAttributes.length; j++) {
      let researchAttribute = tenantProfile.settings.researchAttributes[j];
      let attribute = {
        _id: researchAttribute._id,
        type: researchAttribute.type,
        isVisible: researchAttribute.isVisible,
        isEditable: true,
        isFilterable: true,
        title: researchAttribute.type == ATTRIBUTE_TYPE.STEPPER ? researchAttribute.component.readinessLevelTitle : '',
        shortTitle: researchAttribute.type == ATTRIBUTE_TYPE.STEPPER ? researchAttribute.component.readinessLevelShortTitle : '',
        description: '',
        valueOptions: researchAttribute.type == ATTRIBUTE_TYPE.STEPPER ? researchAttribute.component.readinessLevels.map(rl => {
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

    tenantProfile.settings.researchAttributes = researchAttributes;
    tenantPromises.push(tenantProfile.save());
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

    let attributes = [];

    if (trlAttribute && trlValue) {
      attributes.push({ attributeId: mongoose.Types.ObjectId(trlValue.component.toString()), value: trlValue.value ? trlAttribute.valueOptions[trlValue.value.index].value : null });
    }

    if (marlAttribute && marlValue) {
      attributes.push({ attributeId: mongoose.Types.ObjectId(marlValue.component.toString()), value: marlValue.value ? marlAttribute.valueOptions[marlValue.value.index].value : null });
    }

    if (srlAttribute && srlValue) {
      attributes.push({ attributeId: mongoose.Types.ObjectId(srlValue.component.toString()), value: srlValue.value ? srlAttribute.valueOptions[srlValue.value.index].value : null })
    }

    research.attributes = attributes;

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


