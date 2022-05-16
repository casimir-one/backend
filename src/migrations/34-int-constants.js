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
const { ASSESSMENT_CRITERIA_TYPE, PROJECT_CONTENT_TYPES } = require('@deip/constants');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const Schema = mongoose.Schema;

// const DraftSchema = require('../schemas/DraftSchema');
// const ProjectContentSchema = require('../schemas/ProjectContentSchema');
// const ProjectSchema = require('../schemas/ProjectSchema');
// const UserInviteSchema = require('../schemas/UserInviteSchema');
// const UserNotificationSchema = require('../schemas/UserNotificationSchema');
// const UserSchema = require('../schemas/UserSchema');
// const UserBookmarkSchema = require('../schemas/UserBookmarkSchema');
// const ReviewRequestSchema = require('../schemas/ReviewRequestSchema');

const DraftSchemaClass = new Schema({
  "portalId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "folder": { type: String, required: true },
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "type": {
    type: Schema.Types.Mixed,
    required: true
  },
  "status": {
    type: Schema.Types.Mixed,
    required: true
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const ProjectContentSchemaClass = new Schema({
  "_id": { type: String },
  "portalId": { type: String, required: true },
  "projectId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "folder": { type: String, required: true },
  "title": { type: String, required: true },
  "hash": { type: String, index: true },
  "algo": { type: String },
  "type": {
    type: Schema.Types.Mixed,
    required: true
  },
  "status": {
    type: Schema.Types.Mixed,
    required: true
  },
  "packageFiles": [{
    "_id": false,
    "filename": { type: String, required: true },
    "hash": { type: String, required: true },
    "ext": { type: String, required: true },
  }],
  "authors": [{ type: String }],
  "references": [{ type: String }],
  "foreignReferences": [{ type: String }],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const AttributeValueSchema = new Schema({
  "_id": false,
  "attributeId": { type: Schema.Types.ObjectId, required: false },
  "value": { type: Schema.Types.Mixed, default: null }
});
const ProjectSchemaClass = new Schema({
  "_id": { type: String, required: true },
  "portalId": { type: String, required: true },
  "teamId": { type: String, required: true },
  "attributes": [AttributeValueSchema],
  "status": { type: Schema.Types.Mixed, required: false },
  "isDefault": { type: Boolean, default: false }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const UserInviteSchemaClass = new Schema({
  "_id": { type: String },
  "portalId": { type: String, required: true },
  "invitee": { type: String, required: true, index: true },
  "creator": { type: String },
  "teamId": { type: String, required: true, index: true },
  "notes": { type: String, required: false, trim: true },
  "rewardShare": { type: String, default: undefined },
  "failReason": { type: String },
  "status": {
    type: Schema.Types.Mixed,
    required: true
  },
  "expiration": { type: Date, required: true, index: true },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } })

const UserNotificationSchemaClass = new Schema({
  "portalId": { type: String, required: true },
  "username": { type: String, required: true, index: true },
  "status": {
    type: Schema.Types.Mixed,
    required: true
  },
  "type": {
    type: Schema.Types.Mixed,
    required: true
  },
  "metadata": { _id: false, type: Object, default: {} },
}, {
  "timestamps": {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
});

const UserRole = new Schema({
  "_id": false,
  "role": { type: String, required: true, trim: true },
  "label": { type: String, trim: true },
  "teamId": { type: String, required: true }
});
const UserSchemaClass = new Schema({
  "_id": { type: String },
  "portalId": { type: String, required: true },
  "email": { type: String, required: true, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "signUpPubKey": { type: String, default: null },
  "status": { type: Schema.Types.Mixed, required: true },
  "teams": { type: [String], default: [] },
  "attributes": [AttributeValueSchema],
  "roles": [UserRole],
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

const UserBookmarkSchemaClass = new Schema({
  "portalId": { type: String, required: true },
  "username": { type: String, required: true },
  "type": {
    type: Schema.Types.Mixed,
    required: true
  },
  "ref": { type: String, required: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const ReviewRequestSchemaClass = new Schema({
  "portalId": { type: String, required: true },
  "expert": { type: String, required: true, index: true },
  "requestor": { type: String, required: true },
  "projectContentId": { type: String, required: true },
  "status": {
    type: Schema.Types.Mixed,
    required: true
  },
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });

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
  "isHidden": { type: Boolean, default: false },
  "isEditable": { type: Boolean, default: true },
  "isRequired": { type: Boolean, default: false }
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
  "teamId": { type: String, required: false, default: null },
  "label": { type: String, required: true, trim: true },
  "role": { type: String, required: true, trim: true },
  "modules": AppModuleMap
});

const GlobalNetworkSettings = new Schema({
  "visiblePortalIds": { type: [String], default: [] } ,
  "isGlobalScopeVisible": { type: Boolean, default: false }
});

const ReviewQuestion = new Schema({
  "question": { type: String, required: true },
  "contentTypes": [Number]
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

const PortalSchemaClass = new Schema({
  "_id": { type: String },
  "name": { type: String },
  "serverUrl": { type: String, required: true },
  "shortName": { type: String },
  "description": { type: String },
  "email": { type: String, default: null, trim: true, index: true, match: [/\S+@\S+\.\S+/, 'email is invalid'] },
  "logo": { type: String, default: "default_portal_logo.png" },
  "banner": { type: String, default: "default_banner_logo.png" },
  "network": GlobalNetworkSettings,
  "settings": {
    "signUpPolicy": {
      type: Schema.Types.Mixed,
      required: true
    },
    "newProjectPolicy": {
      type: Schema.Types.Mixed
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
    "attributeSettings": { type: Object },
    "layoutSettings": { type: Object },
    "layouts": { type: Schema.Types.Mixed },
    "faq": [FAQ],
    "theme": { type: Object },
    "modules": AppModuleMap,
    "roles": [UserRoleModuleMap]
  }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' }, minimize: false });

const DraftSchema = mongoose.model('draft', DraftSchemaClass);
const ProjectContentSchema = mongoose.model('project-content', ProjectContentSchemaClass);
const ProjectSchema = mongoose.model('project', ProjectSchemaClass);
const UserInviteSchema = mongoose.model('user-invites', UserInviteSchemaClass);
const UserNotificationSchema = mongoose.model('user-notifications', UserNotificationSchemaClass);
const UserSchema = mongoose.model('user-profile', UserSchemaClass);
const UserBookmarkSchema = mongoose.model('user-bookmark', UserBookmarkSchemaClass);
const ReviewRequestSchema = mongoose.model('review-requests', ReviewRequestSchemaClass);
const PortalSchema = mongoose.model('portal', PortalSchemaClass);

const PROJECT_CONTENT_DRAFT_STATUS = {
  IN_PROGRESS: "in-progress",
  PROPOSED: "proposed",
  PUBLISHED: "published",
  "in-progress": 1,
  "proposed": 2,
  "published": 3,
}

const PROJECT_STATUS = {
  PROPOSED: "proposed",
  APPROVED: "approved",
  DELETED: "deleted",
  "proposed": 1,
  "approved": 2,
  "deleted": 3,
}

const USER_INVITE_STATUS = {
  SENT: "sent",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  PROPOSED: "proposed", //deprecated
  "sent": 1,
  "approved": 2,
  "rejected": 3,
  "expired": 4,
  "proposed": 5,
}

const USER_NOTIFICATION_STATUS = {
  "unread": 1,
  "read": 2
}

const USER_NOTIFICATION_TYPE = {
  PROPOSAL: "proposal",
  PROPOSAL_ACCEPTED: "proposal-accepted",
  INVITATION: "invitation",
  INVITATION_APPROVED: "invitation-approved",
  INVITATION_REJECTED: "invitation-rejected",
  EXCLUSION_APPROVED: "exclusion-approved",
  PROJECT_CONTENT_EXPERT_REVIEW: "project-content-expert-review",
  PROJECT_CONTENT_EXPERT_REVIEW_REQUEST: "project-content-expert-review-request",
  PROJECT_NDA_PROPOSED: "project-nda-request",
  PROJECT_NDA_SIGNED: "project-nda-signed",
  PROJECT_NDA_REJECTED: "project-nda-rejected",
  "proposal": 1,
  "proposal-accepted": 2,
  "invitation": 3,
  "invitation-approved": 4,
  "invitation-rejected": 5,
  "exclusion-approved": 6,
  "research-content-expert-review": 7,
  "research-content-expert-review-request": 8,
  "research-nda-request": 9,
  "research-nda-signed": 10,
  "research-nda-rejected": 11,
}

const USER_PROFILE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  "pending": 1,
  "approved": 2,
}

const USER_BOOKMARK_TYPE = {
  "research": 1
};

const REVIEW_REQUEST_STATUS = {
  "pending": 1,
  "approved": 2,
  "denied": 3
}

const PROJECT_CONTENT_FORMAT = {
  "dar": 1,
  "package": 2,
  "file": 3
}

const SIGN_UP_POLICY = {
  FREE: "free",
  ADMIN_APPROVAL: "admin-approval",
  "free": 1,
  "admin-approval": 2,
};

const run = async () => {
  const draftsPromises = [];
  const projectContentsPromises = [];
  const projectsPromises = [];
  const userInvitesPromises = [];
  const userNotificationsPromises = [];
  const usersPromises = [];
  const userBookmarksPromises = [];
  const reviewRequestsPromises = [];
  const portalsPromises = [];

  const drafts = await DraftSchema.find({});
  const projectContents = await ProjectContentSchema.find({});
  const projects = await ProjectSchema.find({});
  const userInvites = await UserInviteSchema.find({});
  const userNotifications = await UserNotificationSchema.find({});
  const users = await UserSchema.find({});
  const userBookmarks = await UserBookmarkSchema.find({});
  const reviewRequests = await ReviewRequestSchema.find({});
  const portals = await PortalSchema.find({});

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i];
    if (PROJECT_CONTENT_DRAFT_STATUS[draft.status]) {
      draft.status = PROJECT_CONTENT_DRAFT_STATUS[draft.status];
    }
    if (PROJECT_CONTENT_FORMAT[draft.type]) {
      draft.type = PROJECT_CONTENT_FORMAT[draft.type];
    }
    draftsPromises.push(draft.save());
  }

  for (let i = 0; i < projectContents.length; i++) {
    const projectContent = projectContents[i];
    if (PROJECT_CONTENT_DRAFT_STATUS[projectContent.status]) {
      projectContent.status = PROJECT_CONTENT_DRAFT_STATUS[projectContent.status];
    }
    if (PROJECT_CONTENT_FORMAT[projectContent.type]) {
      projectContent.type = PROJECT_CONTENT_FORMAT[projectContent.type];
    }
    projectContentsPromises.push(projectContent.save());
  }

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    if (PROJECT_STATUS[project.status]) {
      project.status = PROJECT_STATUS[project.status];
      projectsPromises.push(project.save());
    }
  }

  for (let i = 0; i < userInvites.length; i++) {
    const userInvite = userInvites[i];
    if (USER_INVITE_STATUS[userInvite.status]) {
      userInvite.status = USER_INVITE_STATUS[userInvite.status];
      userInvitesPromises.push(userInvite.save());
    }
  }

  for (let i = 0; i < userNotifications.length; i++) {
    const userNotification = userNotifications[i];
    if (USER_NOTIFICATION_STATUS[userNotification.status]) {
      userNotification.status = USER_NOTIFICATION_STATUS[userNotification.status];
    }
    if (USER_NOTIFICATION_TYPE[userNotification.type]) {
      userNotification.type = USER_NOTIFICATION_TYPE[userNotification.type];
    }
    userNotificationsPromises.push(userNotification.save());
  }

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (USER_PROFILE_STATUS[user.status]) {
      user.status = USER_PROFILE_STATUS[user.status];
      usersPromises.push(user.save());
    }
  }

  for (let i = 0; i < userBookmarks.length; i++) {
    const userBookmark = userBookmarks[i];
    if (USER_BOOKMARK_TYPE[userBookmark.type]) {
      userBookmark.type = USER_BOOKMARK_TYPE[userBookmark.type];
      userBookmarksPromises.push(userBookmark.save());
    }
  }

  for (let i = 0; i < reviewRequests.length; i++) {
    const reviewRequest = reviewRequests[i];
    if (REVIEW_REQUEST_STATUS[reviewRequest.status]) {
      reviewRequest.status = REVIEW_REQUEST_STATUS[reviewRequest.status];
      reviewRequestsPromises.push(reviewRequest.save());
    }
  }

  for (let i = 0; i < portals.length; i++) {
    const portal = portals[i];
    if (SIGN_UP_POLICY[portal.settings.signUpPolicy]) {
      portal.settings.signUpPolicy = SIGN_UP_POLICY[portal.settings.signUpPolicy];
    }
    if (portal.settings.newProjectPolicy && SIGN_UP_POLICY[portal.settings.newProjectPolicy]) {
      portal.settings.newProjectPolicy = SIGN_UP_POLICY[portal.settings.newProjectPolicy];
    }
    portalsPromises.push(portal.save());
  }

  await Promise.all(draftsPromises);
  await Promise.all(projectContentsPromises);
  await Promise.all(projectsPromises);
  await Promise.all(userInvitesPromises);
  await Promise.all(userNotificationsPromises);
  await Promise.all(usersPromises);
  await Promise.all(userBookmarksPromises);
  await Promise.all(reviewRequestsPromises);
  await Promise.all(portalsPromises);
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