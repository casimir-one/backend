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
const deipRpc = require('@deip/rpc-client');

deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);

const run = async () => {
  let list = await deipRpc.api.getAllResearchesListingAsync(0,0);
  let researches = await Promise.all(list.map(research => deipRpc.api.getResearchByIdAsync(research.research_id)));
  let promises = researches.map(research => {
    let info = JSON.parse(research.abstract);
    let milestones = info.milestones.map(m => {
      return { ...m, budget: "", purpose: "" };
    })
    
    return researchService.upsertResearch({
      researchGroupInternalId: research.research_group_id,
      permlink: research.permlink,
      milestones: milestones,
      videoSrc: info.videoSrc || "",
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
