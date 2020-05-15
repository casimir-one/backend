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
const deipRpc = require('@deip/rpc-client');


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const run = async () => {

  const allAccountsNames = await deipRpc.api.lookupAccountsAsync(0, 10000);
  const allChainAccounts = await deipRpc.api.lookupAccountNamesAsync(allAccountsNames);
  const chainAccounts = allChainAccounts.filter(a => !a.is_research_group);
  
  let promises = [];
  let genesisAccounts = [];

  for (let i = 0; i < chainAccounts.length; i++) {
    let chainAccount = chainAccounts[i];

    let account = {
      name: chainAccount.name,
      recovery_account: "",
      public_key: chainAccount.memo_key
    }

    genesisAccounts.push(account);
  }

  console.log(JSON.stringify(genesisAccounts));

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


