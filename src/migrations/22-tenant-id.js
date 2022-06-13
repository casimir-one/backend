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

const JoinRequest = require('./../schemas/JoinRequestSchema');
const Proposal = require('./../schemas/read/ProposalReadModelSchema');
const Project = require('./../schemas/ProjectSchema');
const ProjectContent = require('./../schemas/ProjectContentSchema');
const Team = require('./../schemas/TeamSchema');
const UserSchema = require('./../schemas/UserSchema');
const UserInviteSchema = require('./../schemas/UserInviteSchema');


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  await JoinRequest.update({}, { $set: { "portalId": config.TENANT } }, { multi: true });
  await Proposal.update({}, { $set: { "portalId": config.TENANT } }, { multi: true });
  await Project.update({}, { $set: { "portalId": config.TENANT } }, { multi: true });
  await ProjectContent.update({}, { $set: { "portalId": config.TENANT } }, { multi: true });
  await Team.update({}, { $set: { "portalId": config.TENANT } }, { multi: true });
  await UserSchema.update({}, { $set: { "portalId": config.TENANT } }, { multi: true });
  await UserInviteSchema.update({}, { $set: { "portalId": config.TENANT } }, { multi: true });
  
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


