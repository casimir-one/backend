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
const researchService = require('./../services/research').default;
const deipRpc = require('@deip/deip-oa-rpc-client');

deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);

const run = async () => {

  let list = await deipRpc.api.getAllResearchesListingAsync(0,0);

  let promises = list.map(research => {
    return researchService.upsertResearch({
      researchGroupId: research.group_id,
      permlink: research.permlink,
      milestones: [],
      videoSrc: "",
      partners: [],
      trl: "basic_principles_of_concept_are_observed_and_reported"
    })
  })

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
