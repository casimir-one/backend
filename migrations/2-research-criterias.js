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

const run = async () => {
  const trlIndex = Math.floor(Math.random() * 7) + 1  
  await Research.update({}, { $set: { "tenantCriterias": [{ "component": "5ebd469a2cea71001f84345a", "type": RESEARCH_COMPONENT_TYPE.STEPPER, "value": { index: trlIndex} }] } }, { multi: true });
  await Research.update({}, { $unset: { "trl": "" } }, { multi: true });
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
