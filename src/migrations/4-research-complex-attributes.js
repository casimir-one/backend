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
   
  await PortalProfile.update({}, { $set: { "settings.projectAttributes.$[].isEditable": true } }, { multi: true });
  await PortalProfile.update({}, { $set: { "settings.projectAttributes.$[].isFilterable": true } }, { multi: true });

  let portalPromises = [];
  const portals = await PortalProfile.find({});

  const roadmapAttribute = {
    _id: mongoose.Types.ObjectId("5f68be12ae115a26e475fb90"),
    type: ATTR_TYPES.ROADMAP,
    isVisible: true,
    isEditable: false,
    isFilterable: false,
    title: "Roadmap",
    shortTitle: "Roadmap",
    description: "Let’s create a roadmap for your project. Well-presented and detailed roadmap attracts more investors to help you to get the funding",
    valueOptions: [],
    defaultValue: null
  };

  const partnersAttribute = {
    _id: mongoose.Types.ObjectId("5f68be12ae115a26e475fb91"),
    type: ATTR_TYPES.PARTNERS,
    isVisible: true,
    isEditable: false,
    isFilterable: false,
    title: "Partners",
    shortTitle: "Partners",
    description: "",
    valueOptions: [],
    defaultValue: null
  };

  const videoSrcAttribute = {
    _id: mongoose.Types.ObjectId("5f68be12ae115a26e475fb92"),
    type: ATTR_TYPES.VIDEO_URL,
    isVisible: true,
    isEditable: true,
    isFilterable: false,
    title: "Link to a video presentation",
    shortTitle: "Video presentation",
    description: "",
    valueOptions: [],
    defaultValue: null
  };

  let allPortalsAttributesIds = [];
  for (let i = 0; i < portals.length; i++) {
    let portalProfile = portals[i];
    portalProfile.settings.projectAttributes.push(roadmapAttribute);
    portalProfile.settings.projectAttributes.push(partnersAttribute);
    portalProfile.settings.projectAttributes.push(videoSrcAttribute);
    portalPromises.push(portalProfile.save());

    allPortalsAttributesIds.push(...portalProfile.settings.projectAttributes.map(a => a._id));
  }

  await Promise.all(portalPromises);
  
  const projects = await Project.find({});
  let projectPromises = [];

  for (let i = 0; i < projects.length; i++) {
    let project = projects[i];

    project.attributes.push({ attributeId: roadmapAttribute._id, value: project.milestones.length ? project.milestones : null });
    project.attributes.push({ attributeId: partnersAttribute._id, value: project.partners.length ? project.partners : null });
    project.attributes.push({ attributeId: videoSrcAttribute._id, value: project.videoSrc ? project.videoSrc : null });

    project.attributes = project.attributes.filter(a => allPortalsAttributesIds.some(_id => _id.toString() == a.attributeId.toString()));

    projectPromises.push(project.save());
  }

  await Promise.all(projectPromises);

  await project.update({}, { $unset: { "milestones": "" } }, { multi: true });
  await project.update({}, { $unset: { "partners": "" } }, { multi: true });
  await project.update({}, { $unset: { "videoSrc": "" } }, { multi: true });
  await PortalProfile.update({}, { $unset: { "settings.projectComponents": "" } }, { multi: true });
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


