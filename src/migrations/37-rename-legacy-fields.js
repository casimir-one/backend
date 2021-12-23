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

const AwardWithdrawalRequestSchemaClass = new Schema({
  "tenantId": { type: String, required: true },
  "filename": { type: String, required: true },
  "folder": { type: String, required: false },
  "researchId": { type: String, required: true },
  "researchGroupId": { type: String, required: true },
  "paymentNumber": { type: String, required: true },
  "awardNumber": { type: String, required: true },
  "subawardNumber": { type: String, required: true },
  "hash": { type: String, index: true },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
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
    "reviewQuestions": {
      type: Schema.Types.Mixed,
      default: [
        { "question": "Do you recommend the submission for funding?", "contentTypes": [] },
        { "question": "Describe the strength or weaknesses of the submissions", "contentTypes": [] },
        { "question": "How well does the submission align with the mission?", "contentTypes": [] }
      ]
    },
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

const ReviewRequestSchemaClass = new Schema({
  "tenantId": { type: String, required: true },
  "expert": { type: String, required: true, index: true },
  "requestor": { type: String, required: true },
  "projectContentId": { type: String, required: true },
  "status": {
    type: Number,
    required: true
  },
}, { timestamps: true });

const UserBookmarkSchemaClass = new Schema({
  "tenantId": { type: String, required: true },
  "username": { type: String, required: true },
  "type": {
    type: Number,
    required: true,
  },
  "ref": { type: String, required: true }
}, { timestamps: true });

const UserInviteSchemaClass = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "invitee": { type: String, required: true, index: true },
  "creator": { type: String },
  "researchGroupExternalId": { type: String, required: true, index: true },
  "notes": { type: String, required: false, trim: true },
  "rewardShare": { type: String, default: undefined },
  "failReason": { type: String },
  "status": {
    type: Number,
    required: true
  },
  "expiration": { type: Number, required: true, index: true },
}, { timestamps: true });

const UserNotificationSchemaClass = new Schema({
  "tenantId": { type: String, required: true },
  "username": { type: String, required: true, index: true },
  "status": {
    type: Number,
    required: true
  },
  "type": {
    type: Number,
    required: true
  },
  "metadata": { _id: false, type: Object, default: {} },
}, {
  "timestamps": true
});

const AssetSettingsSchema = new Schema({
  "_id": false,
  "projectId": { type: String, required: false, default: null },
  "maxSupply": { type: String, required: false },
  "minBallance": { type: String, required: false },
  "licenseRevenueHoldersShare": { type: String, required: false }
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

const ContractAgreementSchemaClass = new Schema({
  "_id": { type: String },
  "tenantId": { type: String, required: true },
  "status": { type: Number, required: true },
  "creator": { type: String, required: true},
  "parties": { type: Array, required: true },
  "hash": { type: String, required: true},
  "activationTime": { type: Number },
  "expirationTime": { type: Number },
  "acceptedByParties": { type: Array, default: [] },
  "proposalId": { type: String },
  "signers": { type: Schema.Types.Mixed },
  "type": {
    type: Number,
    required: true
  },
  "terms": { type: Object, required: true }
}, { timestamps: true });

const DocumentTemplateSchemaClass = new Schema({
  "account": { type: String, required: true },
  "title": { type: String, required: false },
  "body": { type: Object, required: true },
  "creator": { type: String, required: true },
  "tenantId": { type: String, required: true },
}, { timestamps: true });

const DomainSchemaClass = new Schema({
  "_id": { type: String, required: true },
  "parentExternalId": { type: String, required: false },
  "name": { type: String, required: true },
  "tenantId": { type: String, required: false },
  "isGlobalScope": { type: Boolean, default: true }
});

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

const InvestmentOpportunityParticipationSchemaClass = new Schema({
  "tenantId": { type: String, required: true },
  "investmentOpportunityId": { type: String, required: true },
  "investor": { type: String, required: true },
  "asset": { type: Schema.Types.Mixed },
  "timestamp": { type: Number, required: true },
  "projectId": { type: String }
});

const InvestmentOpportunitySchemaClass = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "title": { type: String },
  "metadata": { type: Object },
  "teamId": { type: String, required: true },
  "startTime": { type: Number, required: true },
  "endTime": { type: Number, required: true },
  "shares": { type: Schema.Types.Mixed },
  "softCap": { type: Schema.Types.Mixed },
  "hardCap": { type: Schema.Types.Mixed },
  "creator": { type: String, required: true },
  "totalInvested": { type: Schema.Types.Mixed },
  "type": {
    type: Number,
    required: true
  },
  "status": {
    type: Number,
    required: true
  },
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

const ReviewSchemaClass = new Schema({
  "_id": { type: String, required: true },
  "tenantId": { type: String, required: true },
  "researchExternalId": { type: String, required: true },
  "researchContentExternalId": { type: String, required: true },
  "author": { type: String, required: true },
  "content": { type: String, required: true }
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

const ReviewSchema = mongoose.model('reviews', ReviewSchemaClass);

const ProjectSchema = mongoose.model('research', ProjectSchemaClass);

const ProjectContentSchema = mongoose.model('research-content', ProjectContentSchemaClass);

const InvestmentOpportunitySchema = mongoose.model('investment-opportunity', InvestmentOpportunitySchemaClass);

const InvestmentOpportunityParticipationSchema = mongoose.model('investment-opportunity-participation', InvestmentOpportunityParticipationSchemaClass);

const DraftSchema = mongoose.model('draft', DraftSchemaClass);

const DomainSchema = mongoose.model('discipline', DomainSchemaClass);

const DocumentTemplateSchema = mongoose.model('document-template', DocumentTemplateSchemaClass);

const ContractAgreementSchema = mongoose.model('contract-agreement', ContractAgreementSchemaClass);

const AttributeSchema = mongoose.model('attribute', AttributeSchemaClass);

const AssetSchema = mongoose.model('assets', AssetSchemaClass);

const AssetDepositRequestSchema = mongoose.model('asset-deposit-request', AssetDepositRequestSchemaClass);

const AwardWithdrawalRequestSchema = mongoose.model('award-withdrawal-request', AwardWithdrawalRequestSchemaClass);

const PortalSchema = mongoose.model('tenants-profiles', PortalSchemaClass);

const ReviewRequestSchema = mongoose.model('review-requests', ReviewRequestSchemaClass);

const UserNotificationSchema = mongoose.model('user-notifications', UserNotificationSchemaClass);

const UserInviteSchema = mongoose.model('user-invite', UserInviteSchemaClass);

const UserBookmarkSchema = mongoose.model('user-bookmark', UserBookmarkSchemaClass);

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

  await AwardWithdrawalRequestSchema.updateMany({}, {
    $rename: {
      "tenantId": "portalId",
      "researchId": "projectId",
      "researchGroupId": "teamId"
    }
  }, { multi: true });

  await UserInviteSchema.updateMany({}, {
    $rename: {
      "tenantId": "portalId",
      "researchGroupExternalId": "teamId"
    }
  }, { multi: true });

  await DomainSchema.updateMany({}, {
    $rename: {
      "tenantId": "portalId",
      "parentExternalId": "parentId"
    }
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

  await ReviewSchema.updateMany({}, {
    $rename: {
      "tenantId": "portalId",
      "researchExternalId": "projectId",
      "researchContentExternalId": "projectContentId"
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

  await InvestmentOpportunitySchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await InvestmentOpportunityParticipationSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await DraftSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await DocumentTemplateSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await ContractAgreementSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await AttributeSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await AssetSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await UserBookmarkSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await ProposalSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await ReviewRequestSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  await UserNotificationSchema.updateMany({}, { $rename: { "tenantId": "portalId" } }, { multi: true });
  // await AssetDepositRequestSchema.updateMany({}, {}, { multi: true });

  // rename collections
  await mongoose.connection.db.collection('disciplines').rename('domains');
  await mongoose.connection.db.collection('research-contents').rename('project-contents');
  await mongoose.connection.db.collection('researches').rename('projects');
  await mongoose.connection.db.collection('research-groups').rename('teams-daos');
  await mongoose.connection.db.collection('investment-opportunity-participations').rename('investments');
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