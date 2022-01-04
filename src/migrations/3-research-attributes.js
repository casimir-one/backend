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

  await Project.update({}, { $rename: { portalCriterias: "attributes" } }, { multi: true });
  await PortalProfile.update({}, { $rename: { "settings.projectComponents": "settings.projectAttributes" } }, { multi: true });

  let portalPromises = [];
  let allProjectAttributes = [];

  const portals = await PortalProfile.find({});
  
  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];

    let projectAttributes = [];
    for (let j = 0; j < portalProfile.settings.projectAttributes.length; j++) {
      let projectAttribute = portalProfile.settings.projectAttributes[j];
      let attribute = {
        _id: projectAttribute._id,
        type: projectAttribute.type,
        isVisible: projectAttribute.isVisible,
        isEditable: true,
        isFilterable: true,
        title: projectAttribute.type == ATTR_TYPES.STEPPER ? projectAttribute.component.readinessLevelTitle : '',
        shortTitle: projectAttribute.type == ATTR_TYPES.STEPPER ? projectAttribute.component.readinessLevelShortTitle : '',
        description: '',
        valueOptions: projectAttribute.type == ATTR_TYPES.STEPPER ? projectAttribute.component.readinessLevels.map(rl => {
          return {
            title: rl.title,
            shortTitle: '',
            description: rl.description,
            value: mongoose.Types.ObjectId()
          }
        }) : [],
        defaultValue: null
      };
      projectAttributes.push(attribute);
    }

    portalProfile.settings.projectAttributes = projectAttributes;
    portalPromises.push(portalProfile.save());
    allProjectAttributes.push(...projectAttributes)
  }

  await Promise.all(portalPromises);
  
  const projects = await Project.find({});
  let projectPromises = [];

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];

    let trlAttribute = allProjectAttributes.find(a => a._id.toString() == mongoose.Types.ObjectId("5ebd469a2cea71001f84345a").toString());
    let marlAttribute = allProjectAttributes.find(a => a._id.toString() == mongoose.Types.ObjectId("5ebd47762cea71001f843460").toString());
    let srlAttribute = allProjectAttributes.find(a => a._id.toString() == mongoose.Types.ObjectId("5ebd4b842cea71001f843467").toString());


    let trlValue = project.attributes.find(a => a.component.toString() == trlAttribute._id.toString());
    let marlValue = project.attributes.find(a => a.component.toString() == marlAttribute._id.toString());
    let srlValue = project.attributes.find(a => a.component.toString() == srlAttribute._id.toString());

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

    project.attributes = attributes;

    projectPromises.push(project.save());
  }

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


