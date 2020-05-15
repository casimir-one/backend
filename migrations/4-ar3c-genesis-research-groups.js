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
const ResearchGroup = require('./../schemas/researchGroup');
const deipRpc = require('@deip/rpc-client');


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);



const run = async () => {

  const allChainResearchGroups = await deipRpc.api.lookupResearchGroupsAsync(0, 10000);
  const chainResearchGroups = allChainResearchGroups.filter(rg => !rg.is_personal);
  const rgt_s = await Promise.all(chainResearchGroups.map(d => deipRpc.api.getResearchGroupTokensByResearchGroupAsync(d.id)));
  
  let promises = [];
  let genesisResearchGroups = [];

  for (let i = 0; i < chainResearchGroups.length; i++) {
    let rgt = rgt_s[i];
    let chainResearchGroup = chainResearchGroups[i];

    const researchGroup = new ResearchGroup({
      "_id": chainResearchGroup.external_id,
      "creator": chainResearchGroup.creator,
      "researchAreas": [],
    });
    
    promises.push(researchGroup.save());
  
    let genesisResearchGroup = {
      "account": chainResearchGroup.external_id,
      "creator": chainResearchGroup.creator,
      "name": chainResearchGroup.name,
      "description": chainResearchGroup.description,
      "members": rgt.map(t => t.owner)
    };

    genesisResearchGroups.push(genesisResearchGroup);
  }

  console.log(JSON.stringify(genesisResearchGroups));

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


