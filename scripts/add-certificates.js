require("babel-core/register")({
  "presets": [
      ["env", {
          "targets": {
              "node": true
          }
      }]
  ]
});

const deipRpc = require('@deip/deip-rpc-client');
const config = require('../config');

deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);

const subscriptionService = require('../services/subscriptions').default;

const run = async () => {
  await subscriptionService.adjustSubscriptionExtraQuota('yahor-tsaryk', {
    additionalCertificates: 1,
    additionalContracts: 1,
    additionalFilesShares: 1
  })
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