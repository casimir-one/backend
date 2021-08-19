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
const ResearchContent = require('./../schemas/researchContent');
const ChainService = require('@deip/chain-service').ChainService;
const crypto = require('crypto');


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi()

  const researchContentsPromises = [];
  const chainResearchContents = await chainApi.lookupResearchContentsAsync(0, 10000);
  
  for (let i = 0; i < chainResearchContents.length; i++) {
    const chainResearchContent = chainResearchContents[i];

    const researchContentRef = await ResearchContent.findOne({ _id: chainResearchContent.external_id });

    const title = researchContentRef.title;

    const meta = { title: title };
    const hash = crypto.createHash('sha256').update(JSON.stringify(meta)).digest("hex");

    console.log({ id: chainResearchContent.external_id, hash, title });

    // researchContentsPromises.push(researchContentRef.save());
  }

  await Promise.all(researchContentsPromises);

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


