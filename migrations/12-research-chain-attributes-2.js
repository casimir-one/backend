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
const RESEARCH_ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const run = async () => {
  
  await TenantProfile.update({}, { $set: { "settings.researchAttributes.$[].isBlockchainMeta": false } }, { multi: true });

  const tenantPromises = [];
  const tenants = await TenantProfile.find({});


  const researchDisciplinesAttribute = {
    _id: mongoose.Types.ObjectId(),
    type: RESEARCH_ATTRIBUTE_TYPE.DISCIPLINES_LIST,
    isVisible: true,
    isRequired: true,
    isFilterable: true,
    title: "Disciplines",
    shortTitle: "Disciplines",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: {
      isPartial: false,
      field: "disciplines"
    }
  };

  const researchGroupAttribute = {
    _id: mongoose.Types.ObjectId(),
    type: RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP,
    isVisible: true,
    isRequired: true,
    isFilterable: true,
    title: "Research group",
    shortTitle: "Research group",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: {
      isPartial: false,
      field: "research_group"
    }
  };

  const researchVisibilityAttribute = {
    _id: mongoose.Types.ObjectId(),
    type: RESEARCH_ATTRIBUTE_TYPE.SWITCH,
    isVisible: true,
    isRequired: true,
    isFilterable: false,
    title: "Private project",
    shortTitle: "Visibility",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: {
      isPartial: false,
      field: "is_private"
    }
  };

  const researchInventorsAttribute = {
    _id: mongoose.Types.ObjectId(),
    type: RESEARCH_ATTRIBUTE_TYPE.USERS_LIST,
    isVisible: true,
    isRequired: true,
    isFilterable: false,
    title: "Inventors",
    shortTitle: "Inventors",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: {
      isPartial: true,
      field: "members"
    }
  };


  const researchLicensingAssociateAttribute = {
    _id: mongoose.Types.ObjectId(),
    type: RESEARCH_ATTRIBUTE_TYPE.USER,
    isVisible: true,
    isRequired: true,
    isFilterable: false,
    title: "Licensing associate",
    shortTitle: "Licensing associate",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: {
      isPartial: true,
      field: "members"
    }
  };

  
  for (let i = 0; i < tenants.length; i++) {
    let tenant = tenants[i];

    tenant.settings.researchAttributes.push(researchDisciplinesAttribute);
    tenant.settings.researchAttributes.push(researchGroupAttribute);
    tenant.settings.researchAttributes.push(researchVisibilityAttribute);
    tenant.settings.researchAttributes.push(researchInventorsAttribute);
    tenant.settings.researchAttributes.push(researchLicensingAssociateAttribute);

    tenantPromises.push(tenant.save());
  }
  
  const researchPromises = [];
  const researches = await Research.find({});
  const chainResearches = await deipRpc.api.getResearchesAsync(researches.map(r => r._id.toString()));

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    let chainResearch = chainResearches.find(r => r.external_id == research._id.toString());
    
    research.attributes.push({
      value: chainResearch.disciplines.map(d => d.external_id),
      researchAttributeId: researchDisciplinesAttribute._id
    });

    research.attributes.push({
      value: chainResearch.research_group,
      researchAttributeId: researchGroupAttribute._id
    });

    research.attributes.push({
      value: chainResearch.is_private,
      researchAttributeId: researchVisibilityAttribute._id
    });

    research.attributes.push({
      value: chainResearch.members,
      researchAttributeId: researchInventorsAttribute._id
    });

    researchPromises.push(research.save());
  }

  await Promise.all(tenantPromises);
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


