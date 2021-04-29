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
const bluebird = require('bluebird');
const UserSchema = require('./../schemas/write/UserSchema');
const deipRpc = require('@deip/rpc-client');
const USER_PROFILE_STATUS = require('./../constants/userProfileStatus').default;


deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.DEIP_FULL_NODE_URL);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  await UserSchema.update({}, { $rename: { "contacts": "phoneNumbers" } }, { multi: true });
  await UserSchema.update({}, { $rename: { "socialNetworks": "webPages" } }, { multi: true });
  await UserSchema.update({}, { $rename: { "birthday": "birthdate" } }, { multi: true });
  await UserSchema.update({}, { $set: { "location.$.address": "" } }, { multi: true });
  await UserSchema.update({}, { $set: { "foreignIds": [] } }, { multi: true });
  await UserSchema.update({}, { $set: { "occupation": "" } }, { multi: true });
  await UserSchema.update({}, { $set: { "category": "" } }, { multi: true });
  await UserSchema.update({}, { $set: { "signUpPubKey": "" } }, { multi: true });
  await UserSchema.update({}, { $set: { "status": USER_PROFILE_STATUS.APPROVED } }, { multi: true });
  await UserSchema.update({}, { $unset: { "created": "" } }, { multi: true });
  await UserSchema.update({}, { $unset: { "updated": "" } }, { multi: true });
  
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
