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
const Research = require('./../schemas/research');

const { ATTR_TYPES } = require('@deip/constants');
const ChainService = require('@deip/chain-service').ChainService;

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  const DISCIPLINES_LIST = "disciplines-list";
  const USERS_LIST = "users-list";

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc()

  await TenantProfile.update({}, { $set: { "settings.researchAttributes.$[].isBlockchainMeta": false } }, { multi: true });

  const tenantPromises = [];
  const tenants = await TenantProfile.find({});


  const researchDisciplinesAttribute = {
    _id: mongoose.Types.ObjectId("5f62d4fa98f46d2938dde1eb"),
    type: DISCIPLINES_LIST,
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
    _id: mongoose.Types.ObjectId("5f690af5cdaaa53a27af4a30"),
    type: ATTR_TYPES.RESEARCH_GROUP,
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
    _id: mongoose.Types.ObjectId("5f68d4fa98f36d2938dde5ec"),
    type: ATTR_TYPES.SWITCH,
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
    _id: mongoose.Types.ObjectId("5f690af5cdaaa53a27af4a31"),
    type: USERS_LIST,
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
    _id: mongoose.Types.ObjectId("5f68d4fa98f36d2938dde5ed"),
    type: ATTR_TYPES.USER,
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
    let tenantProfile = tenants[i];

    tenantProfile.settings.researchAttributes.push(researchDisciplinesAttribute);
    tenantProfile.settings.researchAttributes.push(researchGroupAttribute);
    tenantProfile.settings.researchAttributes.push(researchVisibilityAttribute);
    tenantProfile.settings.researchAttributes.push(researchInventorsAttribute);
    tenantProfile.settings.researchAttributes.push(researchLicensingAssociateAttribute);

    tenantPromises.push(tenantProfile.save());
  }
  
  const researchPromises = [];
  const researches = await Research.find({});
  const chainResearches = await Promise.all(researches.map(r => chainRpc.getProjectAsync(r._id)));

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    let chainResearch = chainResearches.find(r => r.projectId == research._id.toString());
    
    research.attributes.push({
      value: chainResearch.disciplines.map(d => d),
      attributeId: researchDisciplinesAttribute._id
    });

    research.attributes.push({
      value: chainResearch.teamId,
      attributeId: researchGroupAttribute._id
    });

    research.attributes.push({
      value: chainResearch.isPrivate,
      attributeId: researchVisibilityAttribute._id
    });

    research.attributes.push({
      value: chainResearch.members || [],
      attributeId: researchInventorsAttribute._id
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


