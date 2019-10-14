require("babel-core/register")({
  "presets": [
      ["env", {
          "targets": {
              "node": true
          }
      }]
  ]
});

const mongoose = require('mongoose');
const bluebird = require('bluebird');
const config = require('./../config');


const deipRpc = require('@deip/deip-rpc-client');
deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);

mongoose.connect(config.mongo['deip-server'].connection);

const { signOperation, sendTransaction } = require('./../utils/blockchain');
const subscriptionService = require('./../services/subscriptions').default;
const stripeService = require('./../services/stripe').default;
const User = require('./../schemas/user');

const run = async () => {
  const usersToMigrate = await User.find({}).sort({ created_at: 1 });

  for (const user of usersToMigrate) {
    console.log(`${user._id}: started`);
    let [bcSubscription] = await deipRpc.api.getSubscriptionsByOwnerAsync(user._id);

    if (!bcSubscription) {
      const create_subscription_op = {
        owner: user._id,
        agent: config.blockchain.accountsCreator.username,
        research_group_id: undefined, // personal
        json_data: JSON.stringify({
          "external_id": "",
          "external_plan_id": "",
          "file_certificate_quota": user.freeUnits.certificates,
          "nda_contract_quota": user.freeUnits.contracts,
          "nda_protected_file_quota": user.freeUnits.fileShares,
          "period": 1, // month
          "billing_date": (new Date()).toISOString().split('.')[0]
        })
      };
      const operations = [
        ['create_subscription', create_subscription_op]
      ];
      const signedTx = await signOperation(operations, config.blockchain.accountsCreator.wif);
      await sendTransaction(signedTx);
      const group = await deipRpc.api.getResearchGroupByPermlinkAsync(user._id);
      bcSubscription = await deipRpc.api.getSubscriptionByResearchGroupIdAsync(group.id);
      console.log(`${user._id}: subscription created`);
    }

    if (user.stripeSubscriptionId && !bcSubscription.external_id) {
      const stripeSubscription = await stripeService.findSubscription(user.stripeSubscriptionId);
      await subscriptionService.setSubscriptionQuota(user._id, {
        certificates: parseInt(stripeSubscription.metadata.availableCertificatesBySubscription) || 0,
        contracts: parseInt(stripeSubscription.metadata.availableContractsBySubscription) || 0,
        filesShares: parseInt(stripeSubscription.metadata.availableFilesSharesBySubscription) || 0,
      });
      await subscriptionService.adjustSubscriptionExtraQuota(user._id, {
        additionalCertificates: parseInt(stripeSubscription.metadata.availableAdditionalCertificates) || 0,
        additionalContracts: parseInt(stripeSubscription.metadata.availableAdditionalContracts) || 0,
        additionalFilesShares: parseInt(stripeSubscription.metadata.availableAdditionalFilesShares) || 0,
      });
      console.log(`${user._id}: limits moved`);
    }
    console.log(`${user._id}: finished`);
  }
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