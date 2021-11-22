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
const AttributeValueSchema = require('./../schemas/AttributeValueSchema');

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const { ATTR_SCOPES, ATTR_TYPES, USER_PROFILE_STATUS } = require('@deip/constants');

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


const UserLocation = new Schema({
  "_id": false,
  "city": { type: String, trim: true, default: null },
  "country": { type: String, trim: true, default: null },
  "address": { type: String, trim: true, default: null }
});
const UserRole = new Schema({
  "_id": false,
  "role": { type: String, required: true, trim: true },
  "label": { type: String, trim: true },
  "researchGroupExternalId": { type: String, required: true }
});

const WebPage = new Schema({
  "_id": false,
  "type": {
    type: String,
    enum: ['webpage', 'facebook', 'linkedin', 'twitter', 'vk'],
    required: true
  },
  "label": { type: String, default: null, required: true, trim: true },
  "link": { type: String, default: "", trim: true },
  "metadata": { type: Object, default: null }
});

const PhoneNumber = new Schema({
  "_id": false,
  "label": { type: String, default: null, required: true, trim: true },
  "ext": { type: String, default: null, trim: true },
  "number": { type: String, required: true, trim: true }
});

const Education = new Schema({
  "_id": false,
  "educationalInstitution": { type: String, required: true, trim: true },
  "period": {
    "from": { type: Date, default: null },
    "to": { type: Date, default: null }
  },
  "degree": { type: String, required: true },
  "area": { type: String, required: true },
  "description": { type: String, default: null },
  "isActive": { type: Boolean, required: true, default: false }
});

const Employment = new Schema({
  "_id": false,
  "company": { type: String, required: true, trim: true },
  "location": {
    "city": { type: String, trim: true, default: null },
    "country": { type: String, trim: true, default: null }
  },
  "period": {
    "from": { type: Date, default: null },
    "to": { type: Date, default: null }
  },
  "position": { type: String, required: true },
  "description": { type: String, default: null },
  "isActive": { type: Boolean, required: true, default: false }
});

const ForeignId = new Schema({
  "_id": false,
  "label": { type: String, required: true, trim: true },
  "id": { type: String, required: true, trim: true },
});

const UserProfileMigratingSchema = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "signUpPubKey": { type: String, default: null },
  "status": { type: String, enum: [...Object.values(USER_PROFILE_STATUS)], required: true },
  "tenant": { type: String, default: undefined },
  "avatar": { type: String, default: undefined },
  "firstName": { type: String, default: undefined },
  "lastName": { type: String, default: undefined },
  "bio": { type: String, default: undefined},
  "birthdate": { type: Date, default: undefined},
  "category": { type: String, default: undefined },
  "occupation": { type: String, default: undefined },
  "roles": [UserRole],
  "location": {
    type: UserLocation,
    default: undefined
  },
  "webPages": {
    type: [WebPage],
    default: undefined
  },
  "phoneNumbers": {
    type: [PhoneNumber],
    default: undefined
  },
  "education": {
    type: [Education],
    default: undefined
  },
  "employment": {
    type: [Employment],
    default: undefined
  },
  "foreignIds": {
    type: [ForeignId],
    default: undefined
  },
  "attributes": [AttributeValueSchema]
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const UserSchema = mongoose.model('user-profile', UserProfileMigratingSchema);


const USER_SYSTEM_ATTRIBUTES = {
  FIRST_NAME: {
    "_id": mongoose.Types.ObjectId("606712cb9f80ae5a1899c8f5"),
    "tenantId": null,
    "isGlobalScope": true,
    "isSystem": true,
    "isFilterable": false,
    "isEditable": true,
    "isRequired": true,
    "isHidden": false,
    "isMultiple": false,
    "defaultValue": null,
    "isBlockchainMeta": false,
    "type": "text",
    "title": "First Name",
    "shortTitle": "First Name",
    "description": "",
    "valueOptions": [],
    "scope": ATTR_SCOPES.USER,
    "isPublished": true,
    "isVisible": true,
    "component": false,
    "__v": 0
  },
  LAST_NAME: {
    "_id": mongoose.Types.ObjectId("606712cb9f80ae5a1899c8f6"),
    "tenantId": null,
    "isGlobalScope": true,
    "isSystem": true,
    "isFilterable": false,
    "isEditable": true,
    "isRequired": true,
    "isHidden": false,
    "isMultiple": false,
    "defaultValue": null,
    "isBlockchainMeta": false,
    "type": "text",
    "title": "Last Name",
    "shortTitle": "Last Name",
    "description": "",
    "valueOptions": [],
    "scope": ATTR_SCOPES.USER,
    "isPublished": true,
    "isVisible": true,
    "component": false,
    "__v": 0
  }
}

const USER_CUSTOM_ATTRIBUTES = {

  "0000000000000000000000000000000000000000": {
    BIRTHDAY: {
      "_id": mongoose.Types.ObjectId("60806660716ce634e22cd1b5"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "date",
      "title": "Birthday",
      "shortTitle": "Birthday",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    BIO: {
      "_id": mongoose.Types.ObjectId("60806660716ce634e22cd1b6"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "textarea",
      "title": "Bio",
      "shortTitle": "Bio",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    COUNTRY: {
      "_id": mongoose.Types.ObjectId("60806660716ce634e22cd1b7"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "text",
      "title": "Country",
      "shortTitle": "Country",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    CITY: {
      "_id": mongoose.Types.ObjectId("60806660716ce634e22cd1b8"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "text",
      "title": "City",
      "shortTitle": "City",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    AVATAR: {
      "_id": mongoose.Types.ObjectId("60806660716ce634e22cd1b9"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "image",
      "title": "Avatar",
      "shortTitle": "Avatar",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    EDUCATION: {
      "_id": mongoose.Types.ObjectId("60806660716ce634e22cd1ba"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "education",
      "title": "Education",
      "shortTitle": "Education",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    EMPLOYMENT: {
      "_id": mongoose.Types.ObjectId("60806660716ce634e22cd1bb"),
      "tenantId": "0000000000000000000000000000000000000000",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "employment",
      "title": "Employment",
      "shortTitle": "Employment",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    }
  },

  "1169d704f8a908016033efe8cce6df93f618a265": {
    BIRTHDAY: {
      "_id": mongoose.Types.ObjectId("606712cb9f80ae5a1899c8f7"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "isBlockchainMeta": false,
      "type": "date",
      "title": "Birthday",
      "shortTitle": "Birthday",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "isPublished": true,
      "isVisible": true,
      "component": false,
      "__v": 0
    },
    BIO: {
      "_id": mongoose.Types.ObjectId("606712cb9f80ae5a1899c8f8"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "isBlockchainMeta": false,
      "type": "textarea",
      "title": "Bio",
      "shortTitle": "Bio",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "isPublished": true,
      "isVisible": true,
      "component": false,
      "__v": 0
    },
    COUNTRY: {
      "_id": mongoose.Types.ObjectId("606712cb9f80ae5a1899c8fa"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "isBlockchainMeta": false,
      "type": "text",
      "title": "Country",
      "shortTitle": "Country",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "isPublished": true,
      "isVisible": true,
      "component": false,
      "__v": 0
    },
    CITY: {
      "_id": mongoose.Types.ObjectId("606712cb9f80ae5a1899c8f9"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "isBlockchainMeta": false,
      "type": "text",
      "title": "City",
      "shortTitle": "City",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "isPublished": true,
      "isVisible": true,
      "component": false,
      "__v": 0
    },
    AVATAR: {
      "_id": mongoose.Types.ObjectId("6068e6a95d09311a7845e32e"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "isBlockchainMeta": false,
      "type": "image",
      "title": "Avatar",
      "shortTitle": "Avatar",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "isPublished": true,
      "isVisible": true,
      "component": false,
      "__v": 0
    },
    EDUCATION: {
      "_id": mongoose.Types.ObjectId("606e2a7a7c25dd3bf0207aca"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "isBlockchainMeta": false,
      "type": "education",
      "title": "Education",
      "shortTitle": "Education",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "isPublished": true,
      "isVisible": true,
      "component": false,
      "__v": 0
    },
    EMPLOYMENT: {
      "_id": mongoose.Types.ObjectId("606e2a7a7c25dd3bf0207acb"),
      "tenantId": "1169d704f8a908016033efe8cce6df93f618a265",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "isBlockchainMeta": false,
      "type": "employment",
      "title": "Employment",
      "shortTitle": "Employment",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "isPublished": true,
      "isVisible": true,
      "component": false,
      "__v": 0
    }
  },

  "58e3bfd753fcb860a66b82635e43524b285ab708": {
    BIRTHDAY: {
      "_id": mongoose.Types.ObjectId("6080668636aa443505fcd3da"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "date",
      "title": "Birthday",
      "shortTitle": "Birthday",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    BIO: {
      "_id": mongoose.Types.ObjectId("6080668636aa443505fcd3db"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "textarea",
      "title": "Bio",
      "shortTitle": "Bio",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    COUNTRY: {
      "_id": mongoose.Types.ObjectId("6080668636aa443505fcd3dc"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "text",
      "title": "Country",
      "shortTitle": "Country",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    CITY: {
      "_id": mongoose.Types.ObjectId("6080668636aa443505fcd3dd"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "text",
      "title": "City",
      "shortTitle": "City",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    AVATAR: {
      "_id": mongoose.Types.ObjectId("6080668636aa443505fcd3de"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "image",
      "title": "Avatar",
      "shortTitle": "Avatar",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    EDUCATION: {
      "_id": mongoose.Types.ObjectId("6080668636aa443505fcd3df"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "education",
      "title": "Education",
      "shortTitle": "Education",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    EMPLOYMENT: {
      "_id": mongoose.Types.ObjectId("6080668636aa443505fcd3e0"),
      "tenantId": "58e3bfd753fcb860a66b82635e43524b285ab708",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "employment",
      "title": "Employment",
      "shortTitle": "Employment",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    }
  },

  "c8a87b12c23f53866acd397f43b591fd4e631419": {
    BIRTHDAY: {
      "_id": mongoose.Types.ObjectId("608066962fdde9352193bc4c"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "date",
      "title": "Birthday",
      "shortTitle": "Birthday",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },

    BIO: {
      "_id": mongoose.Types.ObjectId("608066962fdde9352193bc4d"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "textarea",
      "title": "Bio",
      "shortTitle": "Bio",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    COUNTRY: {
      "_id": mongoose.Types.ObjectId("608066962fdde9352193bc4e"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "text",
      "title": "Country",
      "shortTitle": "Country",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    CITY: {
      "_id": mongoose.Types.ObjectId("608066962fdde9352193bc4f"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "text",
      "title": "City",
      "shortTitle": "City",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    AVATAR: {
      "_id": mongoose.Types.ObjectId("608066962fdde9352193bc50"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": false,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "image",
      "title": "Avatar",
      "shortTitle": "Avatar",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    EDUCATION: {
      "_id": mongoose.Types.ObjectId("608066962fdde9352193bc51"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "education",
      "title": "Education",
      "shortTitle": "Education",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    },
    EMPLOYMENT: {
      "_id": mongoose.Types.ObjectId("608066962fdde9352193bc52"),
      "tenantId": "c8a87b12c23f53866acd397f43b591fd4e631419",
      "isSystem": false,
      "isFilterable": false,
      "isEditable": true,
      "isRequired": true,
      "isHidden": false,
      "isMultiple": false,
      "defaultValue": null,
      "type": "employment",
      "title": "Employment",
      "shortTitle": "Employment",
      "description": "",
      "valueOptions": [],
      "scope": ATTR_SCOPES.USER,
      "__v": 0
    }
  }

}


const run = async () => {

  const userAttributesPromises = [];

  userAttributesPromises.push((new Attribute(USER_SYSTEM_ATTRIBUTES.FIRST_NAME)).save());
  userAttributesPromises.push((new Attribute(USER_SYSTEM_ATTRIBUTES.LAST_NAME)).save());

  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].BIRTHDAY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].BIO).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].COUNTRY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].CITY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].AVATAR).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].EDUCATION).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["0000000000000000000000000000000000000000"].EMPLOYMENT).save());

  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].BIRTHDAY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].BIO).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].COUNTRY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].CITY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].AVATAR).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].EDUCATION).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["1169d704f8a908016033efe8cce6df93f618a265"].EMPLOYMENT).save());

  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].BIRTHDAY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].BIO).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].COUNTRY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].CITY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].AVATAR).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].EDUCATION).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["58e3bfd753fcb860a66b82635e43524b285ab708"].EMPLOYMENT).save());

  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].BIRTHDAY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].BIO).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].COUNTRY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].CITY).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].AVATAR).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].EDUCATION).save());
  userAttributesPromises.push(new Attribute(USER_CUSTOM_ATTRIBUTES["c8a87b12c23f53866acd397f43b591fd4e631419"].EMPLOYMENT).save());

  await Promise.all(userAttributesPromises);


  const userProfiles = await UserSchema.find({});
  const userProfilesPromises = [];

  for (let i = 0; i < userProfiles.length; i++) {
    const userProfileDoc = userProfiles[i];
    const user = userProfileDoc.toObject();

    let userBirthdate = '';

    if (user.birthdate) {
      const d = new Date(user.birthdate)
      userBirthdate = `${d.getFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}-${('0' + d.getDate()).slice(-2)}`
    }

    userProfileDoc.attributes = [
      {
        attributeId: USER_SYSTEM_ATTRIBUTES.FIRST_NAME._id,
        value: user.firstName
      },
      {
        attributeId: USER_SYSTEM_ATTRIBUTES.LAST_NAME._id,
        value: user.lastName
      },
      {
        attributeId: USER_CUSTOM_ATTRIBUTES[user.tenantId].BIRTHDAY._id,
        value: userBirthdate
      },
      {
        attributeId: USER_CUSTOM_ATTRIBUTES[user.tenantId].BIO._id,
        value: user.bio
      },
      {
        attributeId: USER_CUSTOM_ATTRIBUTES[user.tenantId].COUNTRY._id,
        value: user.location ? user.location.country : ''
      },
      {
        attributeId: USER_CUSTOM_ATTRIBUTES[user.tenantId].CITY._id,
        value: user.location ? user.location.city : ''
      },
      {
        attributeId: USER_CUSTOM_ATTRIBUTES[user.tenantId].AVATAR._id,
        value: user.avatar
      },
      {
        attributeId: USER_CUSTOM_ATTRIBUTES[user.tenantId].EDUCATION._id,
        value: user.education
      },
      {
        attributeId: USER_CUSTOM_ATTRIBUTES[user.tenantId].EMPLOYMENT._id,
        value: user.employment
      }
    ];

    userProfileDoc.tenant = undefined;
    userProfileDoc.avatar = undefined;
    userProfileDoc.firstName = undefined;
    userProfileDoc.lastName = undefined;
    userProfileDoc.bio = undefined;
    userProfileDoc.birthdate = undefined;
    userProfileDoc.category = undefined;
    userProfileDoc.occupation = undefined;
    userProfileDoc.location = undefined;
    userProfileDoc.webPages = undefined;
    userProfileDoc.phoneNumbers = undefined;
    userProfileDoc.education = undefined;
    userProfileDoc.employment = undefined;
    userProfileDoc.foreignIds = undefined;

    userProfilesPromises.push(userProfileDoc.save());
  }

  await Promise.all(userProfilesPromises);
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