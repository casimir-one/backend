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

const config = require('../config');

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const AssetDepositRequestSchemaClass = new Schema({
  "assetId": { type: String, required: true },
  "currency": { type: String, required: true },
  "amount": { type: Number, required: true },
  "username": { type: String, required: true }, // user who makes a payment
  "account": { type: String, required: true }, // target balance owner
  "requestToken": { type: String, required: true, index: { unique: true } },
  "timestamp": { type: Number, required: true },
  "status": { type: Number, required: true },
  "txInfo": { type: Object, required: false },
  "invoice": { type: Object, required: false }
}, { timestamps: true });

const UserRoleModuleMap = new Schema({
  "_id": false,
  "roleGroupExternalId": { type: String, required: false, default: null },
  "teamId": { type: String, required: false, default: null },
  "label": { type: String, required: true, trim: true },
  "role": { type: String, required: true, trim: true },
  "modules": { type: Schema.Types.Mixed }
});

const GlobalNetworkSettings = new Schema({
  "visibleTenantIds": { type: [String], default: [] } ,
  "isGlobalScopeVisible": { type: Boolean, default: false }
});

const PortalSchemaClass = new Schema({
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
    "signUpPolicy": { type: String },
    "assesmentCriterias": { type: Schema.Types.Mixed },
    "attributeOverwrites": { type: Schema.Types.Mixed },
    "attributeSettings": { type: Object },
    "layoutSettings": { type: Object },
    "layouts": { type: Schema.Types.Mixed },
    "faq": { type: Schema.Types.Mixed },
    "theme": { type: Object },
    "modules": { type: Schema.Types.Mixed },
    "roles": [UserRoleModuleMap]
  }
}, { timestamps: true, minimize: false });

const ProposalSchemaClass = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: false /* temp */ },
  "cmd": { type: Object, required: false /* temp */ },
  "status": { type: Number, required: true },
  "type": { type: Number, required: true },
  "details": { type: Object, required: true },
  "decisionMakers": { type: Array, default: [] },
  "approvers": { type: Array, default: [] },
  "rejectors": { type: Array, default: [] },
}, { timestamps: true });

const AssetSettingsSchema = new Schema({
  "_id": false,
  "projectId": { type: String, required: false, default: null },
  "maxSupply": { type: String, required: false },
  "minBallance": { type: String, required: false }
});

const AssetSchemaClass = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: false },
  "symbol": { type: String, required: true },
  "precision": { type: Number, required: true },
  "issuer": { type: String, required: true },
  "description": { type: String, required: false },
  "settings": AssetSettingsSchema,
  "type": {
    type: Number,
    required: true
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const AttributeSchemaClass = new Schema({
  "tenantId": { type: String, default: null },
  "isSystem": { type: Boolean, default: false },
  "type": {
    type: Number,
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
  "schemas": { type: Object, required: false, default: {} },
  "valueOptions": { type: Schema.Types.Mixed },
  "defaultValue": { type: Schema.Types.Mixed, default: null },
  "blockchainFieldMeta": { type: Schema.Types.Mixed },
  "schemas": { type: Object, required: false, default: {} },
  "scope": {
    type: Number,
    required: true
  },
  "isGlobalScope": { type: Boolean, default: false }
});

const DocumentTemplateSchemaClass = new Schema({
  "account": { type: String, required: true },
  "title": { type: String, required: false },
  "body": { type: Object, required: true },
  "creator": { type: String, required: true },
  "tenantId": { type: String, required: true },
}, { timestamps: true });

const DraftSchemaClass = new Schema({
  "tenantId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "folder": { type: String, required: true },
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "contentType": {
    type: Number
  },
  "formatType": {
    type: Number,
    required: true
  },
  "status": {
    type: Number,
    required: true
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "jsonData": { type: Object },
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
}, { timestamps: true });

const ProjectContentSchemaClass = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "researchExternalId": { type: String, required: true },
  "researchGroupExternalId": { type: String, required: true },
  "folder": { type: String, required: true },
  "researchId": { type: Number}, // legacy internal id
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "contentType": {
    type: Number,
    required: true
  },
  "formatType": {
    type: Number,
    required: true
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "jsonData": { type: Object },
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
}, { timestamps: true });

const ProjectSchemaClass = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "researchGroupExternalId": { type: String, required: true },
  "attributes": { type: Schema.Types.Mixed },
  "status": { type: Number, required: false },
  "isDefault": { type: Boolean, default: false }
}, { timestamps: true });

const TeamSchemaClass = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "creator": { type: String, required: true },
  "attributes": { type: Schema.Types.Mixed },
  "members": { type: [String], required: true },
  "researchAreas": [Object],
  "isTenantTeam": { type: Boolean, default: false }
}, { timestamps: true });

const UserRole = new Schema({
  "_id": false,
  "role": { type: String, required: true, trim: true },
  "label": { type: String, trim: true },
  "researchGroupExternalId": { type: String, required: true },
  "teamId": { type: String, required: true }
});

const UserSchemaClass = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "signUpPubKey": { type: String, default: null },
  "status": { type: Number, required: true },
  "teams": { type: [String], default: [] },
  "attributes": { type: Schema.Types.Mixed },
  "roles": [UserRole],
}, { timestamps: true });

const UserSchema = mongoose.model('user-profile', UserSchemaClass);

const TeamSchema = mongoose.model('research-groups', TeamSchemaClass);


const ProjectSchema = mongoose.model('research', ProjectSchemaClass);

const ProjectContentSchema = mongoose.model('research-content', ProjectContentSchemaClass);

const DraftSchema = mongoose.model('draft', DraftSchemaClass);

const DocumentTemplateSchema = mongoose.model('document-template', DocumentTemplateSchemaClass);

const AttributeSchema = mongoose.model('attribute', AttributeSchemaClass);

const AssetSchema = mongoose.model('assets', AssetSchemaClass);

const AssetDepositRequestSchema = mongoose.model('asset-deposit-request', AssetDepositRequestSchemaClass);

const PortalSchema = mongoose.model('tenants-profiles', PortalSchemaClass);

const ProposalSchema = mongoose.model('proposals', ProposalSchemaClass);

const run = async () => {
  await mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

  const portalsPromises = [];
  const portals = await PortalSchema.find({});
  for (let i = 0; i < portals.length; i++) {
    const portal = portals[i];
    const portalObj = portal.toObject();
    portal.settings.roles = portalObj.settings.roles.map(r => ({
      ...r,
      teamId: r.roleGroupExternalId || portal._id
    }))
    portalsPromises.push(portal.save());
  }
  await Promise.all(portalsPromises);

  const usersPromises = [];
  const users = await UserSchema.find({});
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userObj = user.toObject();
    user.roles = userObj.roles.map(r => ({
      ...r,
      teamId: r.researchGroupExternalId
    }))
    usersPromises.push(user.save());
  }
  await Promise.all(usersPromises);

  await PortalSchema.updateMany({}, {
      $rename: { "network.visibleTenantIds": "network.visiblePortalIds" },
      $unset: { "settings.roles.$[].roleGroupExternalId": true }
    },
    { multi: true }
  )

  await UserSchema.updateMany({}, {
    $rename: { "tenantId": "portalId" },
    $unset: { "roles.$[].researchGroupExternalId": true },
  }, { multi: true });

  await TeamSchema.updateMany({}, {
    $rename: {
      "tenantId": "portalId",
      "isTenantTeam": "isPortalTeam"
    },
    $unset: {
      "researchAreas": true
    }
  }, { multi: true });

  await ProjectSchema.updateMany({}, {
    $rename: {
      "tenantId": "portalId",
      "researchGroupExternalId": "teamId"
    }
  }, { multi: true });

  await ProjectContentSchema.updateMany({}, {
    $rename: {
      "tenantId": "portalId",
      "researchExternalId": "projectId",
      "researchGroupExternalId": "teamId"
    },
    $unset: {
      "researchId": true
    }
  }, { multi: true });

  await DraftSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await DocumentTemplateSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await AttributeSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await AssetSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await ProposalSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  // await AssetDepositRequestSchema.updateMany({}, {}, { multi: true });

  // rename collections
  await mongoose.connection.db.collection('research-contents').rename('project-contents');
  await mongoose.connection.db.collection('researches').rename('projects');
  await mongoose.connection.db.collection('research-groups').rename('teams-daos');
  await mongoose.connection.db.collection('tenants-profiles').rename('portals');
  await mongoose.connection.db.collection('user-profiles').rename('users-daos');

  await mongoose.disconnect();
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