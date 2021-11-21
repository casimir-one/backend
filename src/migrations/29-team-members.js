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

const { ChainService } = require('@deip/chain-service');

const config = require('./../config');
const { USER_PROFILE_STATUS } = require('./../constants');

const mongoose = require('mongoose');
const TeamSchema = require('./../schemas/TeamSchema');
const UserSchema = require('./../schemas/UserSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  const teamsPromises = [];

  const teams = await TeamSchema.find({});

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const teamObj = team.toObject();
    const refs = await chainRpc.getTeamMemberReferencesAsync([teamObj._id], false);
    const [allMembers] = refs.map((g) => g.map(m => m.account));
    const profiles = await UserSchema.find({ _id: { $in: [...allMembers] }, status: USER_PROFILE_STATUS.APPROVED });
    team.members = [...profiles.map(({ _id }) => _id)];
    teamsPromises.push(team.save());
  }

  await Promise.all(teamsPromises);

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