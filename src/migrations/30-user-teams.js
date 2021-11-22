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

const mongoose = require('mongoose');
const TeamSchema = require('./../schemas/TeamSchema');
const UserSchema = require('./../schemas/UserSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  const usersPromises = [];

  const users = await UserSchema.find({});

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const userObj = user.toObject();
    const usersRefs = await chainRpc.getTeamReferencesAsync([userObj._id], false);
    const [ids] = usersRefs.map((g) => g.map(m => m.team));
    const teams = await TeamSchema.find({ _id: { $in: ids } });
    user.teams = [...teams.map(({ _id }) => _id)];
    usersPromises.push(user.save());
  }

  await Promise.all(usersPromises);

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