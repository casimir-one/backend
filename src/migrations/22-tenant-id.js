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

const AwardWithdrawalRequestSchema = require('./../schemas/AwardWithdrawalRequestSchema');
const ProjectExpressLicenseSchema = require('./../schemas/ProjectExpressLicenseSchema');
const JoinRequest = require('./../schemas/JoinRequestSchema');
const Proposal = require('./../schemas/read/ProposalReadModelSchema');
const ResearchApplication = require('./../schemas/ProjectExpressLicenseSchema');
const Research = require('./../schemas/ProjectSchema');
const ResearchContent = require('./../schemas/ProjectContentSchema');
const ResearchGroup = require('./../schemas/TeamSchema');
const Review = require('./../schemas/ReviewSchema');
const ReviewRequest = require('./../schemas/ReviewRequestSchema');
const UserSchema = require('./../schemas/UserSchema');
const UserBookmarkSchema = require('./../schemas/UserBookmarkSchema');
const UserInviteSchema = require('./../schemas/UserInviteSchema');
const UserNotificationSchema = require('./../schemas/UserNotificationSchema');


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  await AwardWithdrawalRequestSchema.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ProjectExpressLicenseSchema.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await JoinRequest.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await Proposal.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await Research.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ResearchApplication.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ResearchContent.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ResearchGroup.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await Review.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ReviewRequest.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserSchema.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserBookmarkSchema.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserInviteSchema.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserNotificationSchema.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  
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


