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


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
  const MULTI_SELECT = "multi-select";

  const portalPromises = [];
  const portals = await PortalProfile.find({});
  
  const categoriesAttribute = {
    _id: mongoose.Types.ObjectId("5f68be1d54f1da26e538b996"),
    type: MULTI_SELECT,
    isVisible: true,
    isEditable: true,
    isFilterable: true,
    title: "Categories",
    shortTitle: "Categories",
    description: "",
    valueOptions: [],
    defaultValue: null
  };


  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];

    for (let j = 0; j < portalProfile.settings.projectCategories.length; j++) {
      let cat = portalProfile.settings.projectCategories[j];

      categoriesAttribute.valueOptions.push({
        "value" : cat._id,
        "title" : cat.text,
        "shortTitle" : cat.text,
        "description" : ""
      });
    }

    portalProfile.settings.projectAttributes.push(categoriesAttribute);
    portalPromises.push(portalProfile.save());
  }
  
  
  const projectPromises = [];
  const projects = await Project.find({});

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];
    
    if (project.portalCategory) {
      let opt = categoriesAttribute.valueOptions.find(c => c.value.toString() == project.portalCategory._id.toString());
      
      project.attributes.push({
        value: [opt.value],
        attributeId: categoriesAttribute._id
      });
    }

    projectPromises.push(project.save());
  }

  await Promise.all(portalPromises);
  await Promise.all(projectPromises);

  await Project.update({}, { $unset: { "portalCategory": "" } }, { multi: true });
  await PortalProfile.update({}, { $unset: { "settings.projectCategories": "" } }, { multi: true });

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


