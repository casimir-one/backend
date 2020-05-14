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
const Research = require('./../schemas/research');
const deipRpc = require('@deip/rpc-client');
const RESEARCH_COMPONENT_TYPE = require('./../constants/researchComponentsTypes').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);

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
    research.tenantCriterias = [{ "component": "5ebd469a2cea71001f84345a", "type": RESEARCH_COMPONENT_TYPE.STEPPER, "value": { index: trlIndex } }];
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
