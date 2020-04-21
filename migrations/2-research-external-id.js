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
  let list = await deipRpc.api.getAllResearchesListingAsync(0, 0);
  let researches = await Promise.all(list.map(research => deipRpc.api.getResearchByIdAsync(research.research_id)));
  let researchesRms = await Promise.all(list.map(research => researchService.findResearchByPermlink({ permlink: research.permlink })));
  let researchGroups = await Promise.all(list.map(research => deipRpc.api.getResearchGroupByIdAsync(research.group_id)));

  let removePromises = [];
  let upsertPromises = [];


  for (let i = 0; i < researches.length; i++) {

    let research = researches[i];
    let researchRm = researchesRms[i];
    let researchGroup = researchGroups[i];

    removePromises.push(researchService.removeResearchByPermlink(research.permlink));
    upsertPromises.push(researchService.upsertResearch({
      externalId: research.external_id,
      researchGroupExternalId: researchGroup.account.name,
      researchGroupInternalId: research.research_group_id,
      permlink: research.permlink,
      milestones: researchRm.milestones || [],
      videoSrc: researchRm.videoSrc || "",
      partners: researchRm.partners || [],
      trl: researchRm.trl || "basic_principles_of_concept_are_observed_and_reported"
    }));
  }

  await Promise.all(removePromises);
  await Promise.all(upsertPromises);

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
