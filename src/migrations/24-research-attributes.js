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

const { ATTR_SCOPES, ATTR_TYPES, SIGN_UP_POLICY, ASSESSMENT_CRITERIA_TYPE, PROJECT_CONTENT_TYPES } = require('@deip/constants');
const PROJECT_STATUS = require('./../constants').PROJECT_STATUS;

const Schema = mongoose.Schema;
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const systemAttributes = ['5f68be39c579c726e93a3006', '5f68be39c579c726e93a3007', '5f62d4fa98f46d2938dde1eb', '5f68d4fa98f36d2938dde5ec', '5f690af5cdaaa53a27af4a30', '5f6f34a0b1655909aba2398b', '5f7ec161fbb737001f1bacf1', '5f69be12ae115a26e475fb96', '5f690af5cdaaa53a27af4a31', '5f68d4fa98f36d2938dde5ed'];




const AttributeValueOption = new Schema({
  "_id": false,
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "value": { type: Schema.Types.ObjectId, default: null }
});

const BlockchainFieldMeta = new Schema({
  "_id": false,
  "field": { type: String, required: true },
  "isPartial": { type: Boolean, required: false, default: false }
});

const AttributeSchema = new Schema({
  "portalId": { type: String, default: null },
  "isSystem": { type: Boolean, default: false },
  "type": {
    type: Schema.Types.Mixed,
    enum: [...Object.values(ATTR_TYPES)],
    required: true
  },
  "isFilterable": { type: Boolean, default: false },
  "isEditable": { type: Boolean, default: true },
  "isRequired": { type: Boolean, default: false },
  "isHidden": { type: Boolean, default: false },
  "isMultiple": { type: Boolean, default: false },
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "schemas": { type: Object, required: false, default: {} },
  "description": { type: String, required: false },
  "schemas": { type: Object, required: false, default: {} },
  "valueOptions": [AttributeValueOption],
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "blockchainFieldMeta": BlockchainFieldMeta,
  "scope": {
    type: Schema.Types.Mixed,
    enum: [...Object.values(ATTR_SCOPES)],
    required: true
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const Attribute = mongoose.model('attribute', AttributeSchema);


const AttributeValueSchema = new Schema({
  "_id": false,
  "attributeId": { type: Schema.Types.ObjectId, required: false },
  "attributeId": { type: Schema.Types.ObjectId, required: false, default: undefined },
  "value": { type: Schema.Types.Mixed, default: null }
});

const ProjectMigratingSchema = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "status": { type: String, enum: [...Object.values(PROJECT_STATUS)], required: false },

  // To remove
  "portalCriterias": { type: [Object], default: undefined },
  "milestones": { type: [Object], default: undefined },
  "partners": { type: [Object], default: undefined },
  "abstract": { type: String, default: undefined },
  "videoSrc": { type: String, default: undefined }

}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const Project = mongoose.model('project', ProjectMigratingSchema);


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
  "admin-panel-layouts-setup": { type: Boolean, default: false },
  "admin-panel-network-setup": { type: Boolean, default: false }
});

const UserRoleModuleMap = new Schema({
  "_id": false,
  "teamId": { type: String, required: false, default: null },
  "label": { type: String, required: true, trim: true },
  "role": { type: String, required: true, trim: true },
  "modules": AppModuleMap
});

const GlobalNetworkSettings = new Schema({
  "scope": [String],
  "nodes": [String]
});

const ProjectContentAssessmentCriteria = new Schema({
  "_id": false,
  "id": { type: Number, required: true },
  "title": { type: String, required: true },
  "max": { type: Number, required: true }
});

const ProjectContentAssessmentCriterias = new Schema({
  "_id": false,
  "contentType": { type: Number, required: true },
  "values": [ProjectContentAssessmentCriteria]
});

const PortalProfileMigratingSchema = new Schema({
  "_id": { type: String },
  "name": { type: String },
  "serverUrl": { type: String, required: false }, // set later
  "shortName": { type: String },
  "description": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "logo": { type: String, default: "default_portal_logo.png" },
  "banner": { type: String, default: "default_banner_logo.png" },
  "network": GlobalNetworkSettings,
  "settings": {
    "signUpPolicy": {
      type: String,
      enum: [...Object.values(SIGN_UP_POLICY)],
      required: true
    },
    "assesmentCriterias": {
      type: [ProjectContentAssessmentCriterias],
      default: [{
        contentType: PROJECT_CONTENT_TYPES.UNKNOWN,
        values: [
          { id: ASSESSMENT_CRITERIA_TYPE.NOVELTY, title: 'Novelty', max: 5 },
          { id: ASSESSMENT_CRITERIA_TYPE.TECHNICAL_QUALITY, title: 'Technical Quality', max: 5 },
          { id: ASSESSMENT_CRITERIA_TYPE.COMMERCIALIZATION, title: 'Commercialization', max: 5 }
        ]
      }]
    },
    "attributeOverwrites": [AttributeOverwrite],
    "layouts": { type: Object },
    "layouts": { type: Object },
    "faq": [FAQ],
    "theme": { type: Object },
    "modules": AppModuleMap,
    "roles": [UserRoleModuleMap],
    "attributes": { type: [Object], default: undefined }
  }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' }, minimize: false });


const PortalProfile = mongoose.model('portal', PortalProfileMigratingSchema);



const run = async () => {

  const portalProfiles = await PortalProfile.find({});

  const attributesPromises = [];
  const portalProfilesPromises = [];

  portalProfiles[0].settings.attributes.forEach(attr => {
    if (systemAttributes.includes(attr._id.toString())) {
      const attribute = new Attribute({
        portalId: null,
        isSystem: true,
        scope: ATTR_SCOPES.PROJECT,
        isGlobalScope: true,
        ...attr
      });
      
      attributesPromises.push(attribute.save());
    }
  })

  for (let i = 0; i < portalProfiles.length; i++) {
    [...portalProfiles[i].settings.attributes].forEach((attr) => {
      if(!systemAttributes.includes(attr._id.toString())) {
        delete attr._id;
        const attribute = new Attribute({
          portalId: portalProfiles[i]._id,
          isSystem: false,
          scope: ATTR_SCOPES.PROJECT,
          isGlobalScope: false,
          ...attr
        });

        attributesPromises.push(attribute.save());
      }
    })

    portalProfiles[i].settings.attributes = undefined;
    portalProfiles[i].settings.layouts = portalProfiles[i].settings.layouts;
    portalProfiles[i].settings.layouts = undefined;
    
    portalProfilesPromises.push(portalProfiles[i].save());
  }


  const projectPromises = [];  
  const projects = await Project.find({});
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];    
    const attributes = project.attributes.map(attr => ({ attributeId: attr.attributeId, value: attr.value }));
    project.attributes = attributes;

    for (let j = 0; j < project.attributes.length; j++) {
      project.attributes[j].attributeId = undefined;
    }

    project.portalCriterias = undefined;
    project.milestones = undefined;
    project.partners = undefined;
    project.abstract = undefined;
    project.videoSrc = undefined;

    projectPromises.push(project.save());
  }
  

  await Promise.all(attributesPromises);
  await Promise.all(projectPromises);
  await Promise.all(portalProfilesPromises);
  await PortalProfile.update({}, { $rename: { "settings.layouts": "settings.layouts" } }, { multi: true });
    
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