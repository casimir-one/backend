require("babel-core/register")({
  "presets": [
    ["env", {
      "targets": {
        "node": true
      }
    }]
  ]
});
const config = require('./../config');

const mongoose = require('mongoose');
const bluebird = require('bluebird');
const UserProfile = require('./../schemas/user');
const deipRpc = require('@deip/rpc-client');
const USER_PROFILE_STATUS = require('./../constants/userProfileStatus').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);

const run = async () => {

  await UserProfile.update({}, { $rename: { "contacts": "phoneNumbers" } }, { multi: true });
  await UserProfile.update({}, { $rename: { "socialNetworks": "webPages" } }, { multi: true });
  await UserProfile.update({}, { $rename: { "birthday": "birthdate" } }, { multi: true });
  await UserProfile.update({}, { $set: { "location.$.address": "" } }, { multi: true });
  await UserProfile.update({}, { $set: { "foreignIds": [] } }, { multi: true });
  await UserProfile.update({}, { $set: { "occupation": "" } }, { multi: true });
  await UserProfile.update({}, { $set: { "category": "" } }, { multi: true });
  await UserProfile.update({}, { $set: { "signUpPubKey": "" } }, { multi: true });
  await UserProfile.update({}, { $set: { "status": USER_PROFILE_STATUS.APPROVED } }, { multi: true });
  await UserProfile.update({}, { $unset: { "created": "" } }, { multi: true });
  await UserProfile.update({}, { $unset: { "updated": "" } }, { multi: true });
  
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
