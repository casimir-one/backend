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
  
  const portalPromises = [];
  const portals = await PortalProfile.find({});

  const projectCoverImageAttribute = {
    _id: mongoose.Types.ObjectId("5f58d4fa97f36d3938dde1ed"),
    type: ATTR_TYPES.IMAGE,
    isPublished: true,
    isHidden: false,
    isRequired: false,
    isFilterable: false,
    isEditable: true,
    title: "Cover image",
    shortTitle: "Cover image",
    description: "",
    valueOptions: [],
    defaultValue: null,
    blockchainFieldMeta: null
  };

  
  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];
    portalProfile.settings.projectAttributes.push(projectCoverImageAttribute);
    portalPromises.push(portalProfile.save());
  }
  
  const projectPromises = [];
  const projects = await Project.find({});
  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    
    project.attributes.push({
      value: "background.png",
      attributeId: projectCoverImageAttribute._id
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


