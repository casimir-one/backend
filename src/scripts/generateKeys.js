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
const CryptoJS = require("crypto-js");

const config = require('./../config');
const ChainService = require('@deip/chain-service').ChainService;

async function getKeys() {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const deipRpc = chainNodeClient;

  const { owner: privKey, ownerPubkey: pubKey } = deipRpc.auth.getPrivateKeys(
    CryptoJS.lib.WordArray.random(32),
    CryptoJS.lib.WordArray.random(32),
    ['owner']
  );

  console.log("privKey", privKey);
  console.log("pubKey", pubKey);
}

const run = async () => {
  getKeys();
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
