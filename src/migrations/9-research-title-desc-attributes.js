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

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  
  await PortalProfile.update({}, { $set: { "settings.projectAttributes.$[].isBlockchainMeta": false } }, { multi: true });

  const portalPromises = [];
  const portals = await PortalProfile.find({});
  
  const projectTitleAttribute = {
    _id: mongoose.Types.ObjectId("5f68be39c579c726e93a3006"),
    type: ATTR_TYPES.TEXT,
    isVisible: true,
    isEditable: false,
    isFilterable: false,
    isBlockchainMeta: true,
    title: "Title",
    shortTitle: "Title",
    description: "",
    valueOptions: [],
    defaultValue: null
  };


  const projectDescriptionAttribute = {
    _id: mongoose.Types.ObjectId("5f68be39c579c726e93a3007"),
    type: ATTR_TYPES.TEXTAREA,
    isVisible: true,
    isEditable: false,
    isFilterable: false,
    isBlockchainMeta: true,
    title: "Description",
    shortTitle: "Description",
    description: "",
    valueOptions: [],
    defaultValue: null
  };


  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];

    portalProfile.settings.projectAttributes.push(projectTitleAttribute);
    portalProfile.settings.projectAttributes.push(projectDescriptionAttribute);
    
    portalPromises.push(portalProfile.save());
  }
  
  
  const projectPromises = [];
  const projects = await Project.find({});

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    
    project.attributes.push({
      value: project.title,
      attributeId: projectTitleAttribute._id
    });

    project.attributes.push({
      value: project.abstract,
      attributeId: projectDescriptionAttribute._id
    });

    projectPromises.push(project.save());
  }

  await Promise.all(portalPromises);
  await Promise.all(projectPromises);

  await Project.update({}, { $unset: { "title": false } }, { multi: true });
  await Project.update({}, { $unset: { "abstract": false } }, { multi: true });

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


