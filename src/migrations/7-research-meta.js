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
const Research = require('./../schemas/research');

const ChainService = require('@deip/chain-service').ChainService;


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc()

  const researchPromises = [];
  const researches = await Research.find({});
  const chainResearches = await chainRpc.getResearchesAsync(researches.map(r => r._id));

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


