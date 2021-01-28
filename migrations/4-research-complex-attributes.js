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


deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {
   
  await TenantProfile.update({}, { $set: { "settings.researchAttributes.$[].isEditable": true } }, { multi: true });
  await TenantProfile.update({}, { $set: { "settings.researchAttributes.$[].isFilterable": true } }, { multi: true });

  let tenantPromises = [];
  const tenants = await TenantProfile.find({});

  const roadmapAttribute = {
    _id: mongoose.Types.ObjectId("5f68be12ae115a26e475fb90"),
    type: RESEARCH_ATTRIBUTE_TYPE.ROADMAP,
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
    type: RESEARCH_ATTRIBUTE_TYPE.PARTNERS,
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
    type: RESEARCH_ATTRIBUTE_TYPE.VIDEO_URL,
    isVisible: true,
    isEditable: true,
    isFilterable: false,
    title: "Link to a video presentation",
    shortTitle: "Video presentation",
    description: "",
    valueOptions: [],
    defaultValue: null
  };

  let allTenantsAttributesIds = [];
  for (let i = 0; i < tenants.length; i++) {
    let tenant = tenants[i];
    tenant.settings.researchAttributes.push(roadmapAttribute);
    tenant.settings.researchAttributes.push(partnersAttribute);
    tenant.settings.researchAttributes.push(videoSrcAttribute);
    tenantPromises.push(tenant.save());

    allTenantsAttributesIds.push(...tenant.settings.researchAttributes.map(a => a._id));
  }

  await Promise.all(tenantPromises);
  
  const researches = await Research.find({});
  let researchPromises = [];

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];

    research.attributes.push({ researchAttributeId: roadmapAttribute._id, value: research.milestones.length ? research.milestones : null });
    research.attributes.push({ researchAttributeId: partnersAttribute._id, value: research.partners.length ? research.partners : null });
    research.attributes.push({ researchAttributeId: videoSrcAttribute._id, value: research.videoSrc ? research.videoSrc : null });

    research.attributes = research.attributes.filter(a => allTenantsAttributesIds.some(_id => _id.toString() == a.researchAttributeId.toString()));

    researchPromises.push(research.save());
  }

  await Promise.all(researchPromises);

  await Research.update({}, { $unset: { "milestones": "" } }, { multi: true });
  await Research.update({}, { $unset: { "partners": "" } }, { multi: true });
  await Research.update({}, { $unset: { "videoSrc": "" } }, { multi: true });
  await TenantProfile.update({}, { $unset: { "settings.researchComponents": "" } }, { multi: true });
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


