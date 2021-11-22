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
const TeamSchema = require('../schemas/TeamSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const teamsPromises = [];

  const teams = await TeamSchema.find({});

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const teamObj = team.toObject();
    team.isTenantTeam = teamObj.tenantId === teamObj._id ? true : false;
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