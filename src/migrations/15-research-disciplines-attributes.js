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
  const DOMAINS_LIST = "domains-list";

  const portalProfile = await PortalProfile.findOne({ _id: "0000000000000000000000000000000000000000" });

  if (portalProfile) {

    let categoriesAttr = portalProfile.settings.projectAttributes.find(attr => attr.type == DOMAINS_LIST && attr.title == "TTO Categories");
    let domainsAttr = portalProfile.settings.projectAttributes.find(attr => attr.type == DOMAINS_LIST && attr.title == "ORIP Domains");

    const projectPromises = [];
    const projects = await Project.find({});

    for (let i = 0; i < projects.length; i++) {
      let project = projects[i];

      let categoriesA = project.attributes.find(a => a.attributeId.toString() == categoriesAttr._id.toString());
      let domainsA = project.attributes.find(a => a.attributeId.toString() == domainsAttr._id.toString());

      if (domainsA && !categoriesA) {
        project.attributes = project.attributes.filter(a => a.attributeId.toString() != domainsAttr._id.toString());
        project.attributes.push({
          value: domainsA.value._id,
          attributeId: categoriesAttr._id
        })
      }

      let teamAttr = portalProfile.settings.projectAttributes.find(attr => attr.type == ATTR_TYPES.TEAM);
      let teamA = project.attributes.find(a => a.attributeId.toString() == teamAttr._id.toString());

      if (teamA) {
        project.attributes = project.attributes.filter(a => a.attributeId.toString() != teamAttr._id.toString());
        project.attributes.push({
          value: teamA.value._id,
          attributeId: teamAttr._id
        })
      }
      
      projectPromises.push(project.save());
    }

    portalProfile.settings.projectAttributes = portalProfile.settings.projectAttributes.filter(attr => attr.title != "ORIP Domains");

    await portalProfile.save();
    await Promise.all(projectPromises);
  }
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


