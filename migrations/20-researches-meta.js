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
const TenantProfile = require ('./../schemas/tenant');

const deipRpc = require('@deip/rpc-client');
const crypto = require('crypto');

deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);
mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  const researchesPromises = [];
  const chainResearches = await deipRpc.api.lookupResearchesAsync(0, 10000);
  
  for (let i = 0; i < chainResearches.length; i++) {
    const chainResearch = chainResearches[i];

    // const research = await Research.findOne({ _id: chainResearch.external_id });

    // const titleAttr = research.attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString());
    // const title = titleAttr ? titleAttr.value : "";
    const title = chainResearch.title;

    // const descriptionAttr = research.attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString());
    // const description = descriptionAttr ? descriptionAttr.value : "";
    const description = chainResearch.abstract;

    const meta = { title: title, description: description };
    const hash = crypto.createHash('sha256').update(JSON.stringify(meta)).digest("hex");

    console.log({ id: chainResearch.external_id, hash });

    // researchesPromises.push(research.save());
  }

  await Promise.all(researchesPromises);

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


