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

const deipRpc = require('@deip/rpc-client');
const CryptoJS = require("crypto-js");

function getKeys() {
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
