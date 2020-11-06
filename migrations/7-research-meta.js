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
const RESEARCH_ATTRIBUTE_TYPE = require('./../constants/researchAttributeTypes').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const run = async () => {
  
  const researchPromises = [];
  const researches = await Research.find({});
  const chainResearches = await deipRpc.api.getResearchesAsync(researches.map(r => r._id));

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    let chainResearch = chainResearches.find(r => r.external_id == research._id);

    if (chainResearch) {
      research.title = chainResearch.title;
      research.abstract = chainResearch.abstract;
    }

    researchPromises.push(research.save());
  }

  await Promise.all(researchPromises);

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


