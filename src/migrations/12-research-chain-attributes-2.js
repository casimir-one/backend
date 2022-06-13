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
const Project = require('./../schemas/ProjectSchema');

const { ATTR_TYPES } = require('@deip/constants');
const ChainService = require('@deip/chain-service').ChainService;

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  const USERS_LIST = "users-list";

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc()

  await PortalProfile.update({}, { $set: { "settings.projectAttributes.$[].isBlockchainMeta": false } }, { multi: true });

  const portalPromises = [];
  const portals = await PortalProfile.find({});

  const projectGroupAttribute = {
    _id: mongoose.Types.ObjectId("5f690af5cdaaa53a27af4a30"),
    type: ATTR_TYPES.TEAM,
    isVisible: true,
    isRequired: true,
    isFilterable: true,
    title: "Team",
    shortTitle: "Team",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: {
      isPartial: false,
      field: "team"
    }
  };

  const projectVisibilityAttribute = {
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

  const projectInventorsAttribute = {
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


  const projectLicensingAssociateAttribute = {
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

  
  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];

    portalProfile.settings.projectAttributes.push(projectGroupAttribute);
    portalProfile.settings.projectAttributes.push(projectVisibilityAttribute);
    portalProfile.settings.projectAttributes.push(projectInventorsAttribute);
    portalProfile.settings.projectAttributes.push(projectLicensingAssociateAttribute);

    portalPromises.push(portalProfile.save());
  }
  
  const projectPromises = [];
  const projects = await Project.find({});
  const chainProjects = await Promise.all(projects.map(r => chainRpc.getProjectAsync(r._id)));

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    let chainProject = chainProjects.find(r => r.projectId == project._id.toString());

    project.attributes.push({
      value: chainProject.teamId,
      attributeId: projectGroupAttribute._id
    });

    project.attributes.push({
      value: chainProject.isPrivate,
      attributeId: projectVisibilityAttribute._id
    });

    project.attributes.push({
      value: chainProject.members || [],
      attributeId: projectInventorsAttribute._id
    });

    projectPromises.push(project.save());
  }

  await Promise.all(portalPromises);
  await Promise.all(projectPromises);

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


