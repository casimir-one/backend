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
const ATTRIBUTE_SCOPE = require('./../constants').ATTRIBUTE_SCOPE;
const ATTRIBUTE_TYPE = require('./../constants').ATTRIBUTE_TYPE;

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

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
  "tenantId": { type: String, default: null },
  "isSystem": { type: Boolean, default: false },
  "type": {
    type: Schema.Types.Mixed,
    enum: [...Object.values(ATTRIBUTE_TYPE)],
    required: true
  },
  "isFilterable": { type: Boolean, default: false },
  "isEditable": { type: Boolean, default: true },
  "isRequired": { type: Boolean, default: false },
  "isHidden": { type: Boolean, default: false },
  "isMultiple": { type: Boolean, default: false },
  "title": { type: String, required: false },
  "shortTitle": { type: String, required: false },
  "description": { type: String, required: false },
  "valueOptions": [AttributeValueOption],
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "blockchainFieldMeta": BlockchainFieldMeta,
  "scope": {
    type: Schema.Types.Mixed,
    enum: [...Object.values(ATTRIBUTE_SCOPE)],
    required: true
  }
});

const Attribute = mongoose.model('attribute', AttributeSchema);


const TEAM_SYSTEM_ATTRIBUTES = {
  NAME: {
    "_id": mongoose.Types.ObjectId("6092cdf54572573b895a8139"),
    "tenantId": null,
    "isSystem": true,
    "isFilterable": false,
    "isEditable": true,
    "isRequired": true,
    "isHidden": false,
    "isMultiple": false,
    "defaultValue": "",
    "type": ATTRIBUTE_TYPE.TEXT,
    "title": "Name",
    "shortTitle": "Name",
    "description": "",
    "valueOptions": [],
    "scope": ATTRIBUTE_SCOPE.TEAM,
    "blockchainFieldMeta": {
      "isPartial": false,
      "field": "name"
    }
  }
}


const TEAM_CUSTOM_ATTRIBUTES = {

  "0000000000000000000000000000000000000000": {
    DESCRIPTION: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a813a"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": "",
      "type": ATTRIBUTE_TYPE.TEXTAREA,
      "title": "Description",
      "shortTitle": "Description",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM,
      "blockchainFieldMeta": {
        "isPartial": false,
        "field": "description"
      }
    },
    TEAM_LOGO: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a813b"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": ATTRIBUTE_TYPE.IMAGE,
      "title": "Team Logo",
      "shortTitle": "Team Logo",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM
    }
  },


  "1169d704f8a908016033efe8cce6df93f618a265": {
    DESCRIPTION: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a813c"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": "",
      "type": ATTRIBUTE_TYPE.TEXTAREA,
      "title": "Description",
      "shortTitle": "Description",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM,
      "blockchainFieldMeta": {
        "isPartial": false,
        "field": "description"
      }
    },
    TEAM_LOGO: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a813d"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": ATTRIBUTE_TYPE.IMAGE,
      "title": "Team Logo",
      "shortTitle": "Team Logo",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM
    }
  },


  "58e3bfd753fcb860a66b82635e43524b285ab708": {
    DESCRIPTION: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a813e"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": "",
      "type": ATTRIBUTE_TYPE.TEXTAREA,
      "title": "Description",
      "shortTitle": "Description",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM,
      "blockchainFieldMeta": {
        "isPartial": false,
        "field": "description"
      }
    },
    TEAM_LOGO: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a813f"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": ATTRIBUTE_TYPE.IMAGE,
      "title": "Team Logo",
      "shortTitle": "Team Logo",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM
    }
  },

  "c8a87b12c23f53866acd397f43b591fd4e631419": {
    DESCRIPTION: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a8140"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": "",
      "type": ATTRIBUTE_TYPE.TEXTAREA,
      "title": "Description",
      "shortTitle": "Description",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM,
      "blockchainFieldMeta": {
        "isPartial": false,
        "field": "description"
      }
    },
    TEAM_LOGO: {
      "_id": mongoose.Types.ObjectId("6092cdf54572573b895a8141"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": ATTRIBUTE_TYPE.IMAGE,
      "title": "Team Logo",
      "shortTitle": "Team Logo",
      "description": "",
      "valueOptions": [],
      "scope": ATTRIBUTE_SCOPE.TEAM
    }
  }
}


const AttributeValueSchema = new Schema({
  "_id": false,
  "attributeId": { type: Schema.Types.ObjectId, required: false },
  "researchAttributeId": { type: Schema.Types.ObjectId, required: false, default: undefined },
  "value": { type: Schema.Types.Mixed, default: null }
});

const TeamSchema = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: true },
  "name": { type: String, required: false, default: undefined },
  "description": { type: String, required: false, default: undefined },
  "attributes": [AttributeValueSchema],
  "researchAreas": [Object],

}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const ResearchGroupRef = mongoose.model('research-groups', TeamSchema);

const run = async () => {

  const teamAttributesPromises = [];

  teamAttributesPromises.push((new Attribute(TEAM_SYSTEM_ATTRIBUTES.NAME)).save());

  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].DESCRIPTION).save());
  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].TEAM_LOGO).save());

  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].DESCRIPTION).save());
  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].TEAM_LOGO).save());

  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].DESCRIPTION).save());
  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].TEAM_LOGO).save());

  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].DESCRIPTION).save());
  teamAttributesPromises.push(new Attribute(TEAM_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].TEAM_LOGO).save());

  await Promise.all(teamAttributesPromises);


  const teamPromises = [];  
  const researchGroupRefs = await ResearchGroupRef.find({});
  for (let i = 0; i < researchGroupRefs.length; i++) {
    const researchGroupRef = researchGroupRefs[i];
    const researchGroupRefObj = researchGroupRef.toObject();

    researchGroupRef.attributes = [
      {
        attributeId: TEAM_SYSTEM_ATTRIBUTES.NAME._id,
        value: researchGroupRefObj.name || researchGroupRef.creator
      }
    ];

    if (!TEAM_CUSTOM_ATTRIBUTES[researchGroupRefObj.tenantId]) {
      continue;
    }

    researchGroupRef.attributes.push(...[
      {
        attributeId: TEAM_CUSTOM_ATTRIBUTES[researchGroupRefObj.tenantId].DESCRIPTION._id,
        value: researchGroupRefObj.description || researchGroupRef.creator
      },
      {
        attributeId: TEAM_CUSTOM_ATTRIBUTES[researchGroupRefObj.tenantId].TEAM_LOGO._id,
        value: null
      }
    ]);


    researchGroupRef.name = undefined;
    researchGroupRef.description = undefined;

    teamPromises.push(researchGroupRef.save());
  }

  await Promise.all(teamPromises);
    
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