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
const RESEARCH_STATUS = require('./../constants/researchStatus').default;


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const run = async () => {
  
  const researchPromises = [];
  const researchRefs = await Research.find({});

  for (let i = 0; i < researchRefs.length; i++) {
    let researchRef = researchRefs[i];
    researchRef.status = RESEARCH_STATUS.APPROVED;
    researchPromises.push(researchRef.save());
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


