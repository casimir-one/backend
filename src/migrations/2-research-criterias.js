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
const Research = require('./../schemas/research');
const deipRpc = require('@deip/rpc-client');
const ATTRIBUTE_TYPE = require('./../constants/attributeTypes').default;


deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const run = async () => {

  await Research.update({}, { $set: { "tenantCriterias": [] } }, { multi: true });
  await Research.update({}, { $unset: { "trl": "" } }, { multi: true });

  const researches = await Research.find({});
  let promises = [];

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    const trlIndex = getRandomInt(0, 7);
    const marlIndex = getRandomInt(0, 7);
    const srlIndex = getRandomInt(0, 7);
    research.tenantCriterias = [
      { "component": "5ebd469a2cea71001f84345a", "type": ATTRIBUTE_TYPE.STEPPER, "value": { index: trlIndex } },
      { "component": "5ebd47762cea71001f843460", "type": ATTRIBUTE_TYPE.STEPPER, "value": { index: marlIndex } },
      { "component": "5ebd4b842cea71001f843467", "type": ATTRIBUTE_TYPE.STEPPER, "value": { index: srlIndex } },
    ];
    promises.push(research.save());
  }

  return Promise.all(promises);

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
