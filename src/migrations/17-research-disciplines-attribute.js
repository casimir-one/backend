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
  const chainApi = chainService.getChainApi()


  const researchPromises = [];
  const researches = await Research.find({});
  const chainResearches = await chainApi.getResearchesAsync(researches.map(r => r._id.toString()));

  const disciplinesAttributeId = "5f62d4fa98f46d2938dde1eb";
  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    let chainResearch = chainResearches.find(r => r.external_id == research._id.toString());
    let disciplines = chainResearch.disciplines.map(d => d.external_id);

    const attribute = research.attributes.find(attr => attr.attributeId.toString() == disciplinesAttributeId);

    if (attribute) {
      attribute.value = disciplines;
    } else {
      research.attributes.push({
        value: disciplines,
        attributeId: mongoose.Types.ObjectId(disciplinesAttributeId),
      });
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


