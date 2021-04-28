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
const deipRpc = require('@deip/rpc-client');
const mongoose = require('mongoose');

const AwardWithdrawalRequest = require('./../schemas/awardWithdrawalRequest');
const ExpressLicense = require('./../schemas/expressLicense');
const InvestmentPortfolio = require('./../schemas/investmentPortfolio');
const JoinRequest = require('./../schemas/joinRequest');
const Proposal = require('./../schemas/proposal');
const ResearchApplication = require('./../schemas/researchApplication');
const Research = require('./../schemas/research');
const ResearchContent = require('./../schemas/researchContent');
const ResearchGroup = require('./../schemas/researchGroup');
const Review = require('./../schemas/review');
const ReviewRequest = require('./../schemas/reviewRequest');
const UserProfile = require('./../schemas/user');
const UserBookmark = require('./../schemas/userBookmark');
const UserInviteDtoSchema = require('./../schemas/read/UserInviteDtoSchema');
const UserNotification = require('./../schemas/userNotification');


deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  await AwardWithdrawalRequest.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ExpressLicense.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await InvestmentPortfolio.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await JoinRequest.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await Proposal.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await Research.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ResearchApplication.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ResearchContent.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ResearchGroup.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await Review.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await ReviewRequest.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserProfile.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserBookmark.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserInviteDtoSchema.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  await UserNotification.update({}, { $set: { "tenantId": config.TENANT } }, { multi: true });
  
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


