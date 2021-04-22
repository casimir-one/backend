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

require("@babel/register")({
  "only": [
    function (filepath) {
      return filepath.includes("node_modules/@deip") || filepath.includes("node_modules/crc");
    },
  ]
});


const config = require('./../config');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const systemAttributes = ['5f68be39c579c726e93a3006', '5f68be39c579c726e93a3007', '5f62d4fa98f46d2938dde1eb', '5f68d4fa98f36d2938dde5ec', '5f690af5cdaaa53a27af4a30', '5f6f34a0b1655909aba2398b', '5f7ec161fbb737001f1bacf1', '5f69be12ae115a26e475fb96', '5f690af5cdaaa53a27af4a31', '5f68d4fa98f36d2938dde5ed'];
const Attribute = require('./../schemas/attribute');

const ATTRIBUTE_SCOPE = require('../constants').ATTRIBUTE_SCOPE;
const SIGN_UP_POLICY = require('../constants').SIGN_UP_POLICY;
const NEW_RESEARCH_POLICY = require('../constants').NEW_RESEARCH_POLICY;
const ASSESSMENT_CRITERIA_TYPE = require('../constants').ASSESSMENT_CRITERIA_TYPE;
const RESEARCH_CONTENT_TYPES = require('../constants').RESEARCH_CONTENT_TYPES;


const FAQ = new Schema({
  "question": { type: String, required: true },
  "answer": { type: String, required: true },
  "isPublished": { type: Boolean, required: false }
});

const AttributeOverwrite = new Schema({
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "isFilterable": { type: Boolean, default: false },
  "isHidden": { type: Boolean, default: false }
});

const AppModuleMap = new Schema({
  "_id": false,
  "app-eci": { type: Boolean, default: false },
  "app-crowdfunding": { type: Boolean, default: false },
  "app-expert-review": { type: Boolean, default: false },
  "app-assets-management": { type: Boolean, default: false },
  "app-assets-withdrawal": { type: Boolean, default: false },
  "app-assets-deposit": { type: Boolean, default: false },
  "app-grants-management": { type: Boolean, default: false },
  "app-blockchain-explorer": { type: Boolean, default: false },
  "app-user-personal-workspace": { type: Boolean, default: false },

  "app-page-sign-up": { type: Boolean, default: false },
  "app-page-eci-overview": { type: Boolean, default: false },
  "app-page-eci-participiants": { type: Boolean, default: false },
  "app-page-assets": { type: Boolean, default: false },
  "app-page-multisig-transactions": { type: Boolean, default: false },

  "admin-panel-members-management": { type: Boolean, default: false },
  "admin-panel-members-registration": { type: Boolean, default: false },
  "admin-panel-projects-management": { type: Boolean, default: false },
  "admin-panel-projects-registration": { type: Boolean, default: false },
  "admin-panel-attributes-management": { type: Boolean, default: false },
  "admin-panel-attributes-registration": { type: Boolean, default: false },
  "admin-panel-faq-setup": { type: Boolean, default: false },
  "admin-panel-review-setup": { type: Boolean, default: false },
  "admin-panel-layouts-setup": { type: Boolean, default: false },
  "admin-panel-network-setup": { type: Boolean, default: false }
});

const UserRoleModuleMap = new Schema({
  "_id": false,
  "roleGroupExternalId": { type: String, required: false, default: null },
  "label": { type: String, required: true, trim: true },
  "role": { type: String, required: true, trim: true },
  "modules": AppModuleMap
});

const GlobalNetworkSettings = new Schema({
  "scope": [String],
  "nodes": [String]
});

const ReviewQuestion = new Schema({
  "question": { type: String, required: true },
  "contentTypes": [Number]
});

const ResearchContentAssessmentCriteria = new Schema({
  "_id": false,
  "id": { type: Number, required: true },
  "title": { type: String, required: true },
  "max": { type: Number, required: true }
});

const ResearchContentAssessmentCriterias = new Schema({
  "_id": false,
  "contentType": { type: Number, required: true },
  "values": [ResearchContentAssessmentCriteria]
});

const TenantProfileMigratingSchema = new Schema({
  "_id": { type: String },
  "name": { type: String },
  "serverUrl": { type: String, required: true },
  "shortName": { type: String },
  "description": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "logo": { type: String, default: "default_tenant_logo.png" },
  "banner": { type: String, default: "default_banner_logo.png" },
  "network": GlobalNetworkSettings,
  "settings": {
    "signUpPolicy": {
      type: String,
      enum: [...Object.values(SIGN_UP_POLICY)],
      required: true
    },
    "newResearchPolicy": {
      type: String,
      enum: [...Object.values(NEW_RESEARCH_POLICY)],
      required: true
    },
    "reviewQuestions": {
      type: [ReviewQuestion],
      default: [
        { "question": "Do you recommend the submission for funding?", "contentTypes": [] },
        { "question": "Describe the strength or weaknesses of the submissions", "contentTypes": [] },
        { "question": "How well does the submission align with the mission?", "contentTypes": [] }
      ]
    },
    "assesmentCriterias": {
      type: [ResearchContentAssessmentCriterias],
      default: [{
        contentType: RESEARCH_CONTENT_TYPES.UNKNOWN,
        values: [
          { id: ASSESSMENT_CRITERIA_TYPE.NOVELTY, title: 'Novelty', max: 5 },
          { id: ASSESSMENT_CRITERIA_TYPE.TECHNICAL_QUALITY, title: 'Technical Quality', max: 5 },
          { id: ASSESSMENT_CRITERIA_TYPE.COMMERCIALIZATION, title: 'Commercialization', max: 5 }
        ]
      }]
    },
    "attributeOverwrites": [AttributeOverwrite],
    "layouts": { type: Object },
    "faq": [FAQ],
    "theme": { type: Object },
    "modules": AppModuleMap,
    "roles": [UserRoleModuleMap],
    "researchAttributes": [Object]
  }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' }, minimize: false });


const TenantProfile = mongoose.model('tenants-profiles', TenantProfileMigratingSchema);



const run = async () => {
  const tenantProfiles = await TenantProfile.find({}).lean();

  const researchAttributesPromises = [];

  tenantProfiles[0].settings.researchAttributes.forEach(attr => {
    if (systemAttributes.includes(attr._id.toString())) {
      const researchAttribute = new Attribute({
        tenantId: null,
        isSystem: true,
        scope: ATTRIBUTE_SCOPE.RESEARCH,
        ...attr
      });
      
      researchAttributesPromises.push(researchAttribute.save());
    }
  })

  for (let i = 0; i < tenantProfiles.length; i++) {
    [...tenantProfiles[i].settings.researchAttributes].forEach((attr) => {
      if(!systemAttributes.includes(attr._id.toString())) {
        delete attr._id;
        const researchAttribute = new Attribute({
          tenantId: tenantProfiles[i]._id,
          isSystem: false,
          scope: ATTRIBUTE_SCOPE.RESEARCH,
          ...attr
        });

        researchAttributesPromises.push(researchAttribute.save());
      }
    })
  }

  await Promise.all(researchAttributesPromises);
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