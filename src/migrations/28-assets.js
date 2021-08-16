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

require("@babel/register")({
  "only": [
    function (filepath) {
      return filepath.includes("node_modules/@deip") || filepath.includes("node_modules/crc");
    },
  ]
});

const { ChainService } = require('@deip/chain-service');

const config = require('./../config');

const mongoose = require('mongoose');
const Asset = require('./../schemas/AssetSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const chainAssets = await chainApi.lookupAssetsAsync('', 10000);
  const assetsPromises = [];

  for (let i = 0; i < chainAssets.length; i++) {
    const chainAsset = chainAssets[i];
    const newAsset = {
      _id: chainAsset.string_symbol,
      stringSymbol: chainAsset.string_symbol,
      precision: chainAsset.precision,
      issuer: chainAsset.issuer,
      description: chainAsset.description,
      maxSupply: parseInt(chainAsset.max_supply),
      type: chainAsset.type
    }
    if (chainAsset.tokenized_research) newAsset.tokenizedProjectId = chainAsset.tokenized_research;
    if (chainAsset.license_revenue_holders_share) newAsset.licenseRevenueHoldersShare = chainAsset.license_revenue_holders_share;
    
    const asset = new Asset(newAsset);

    assetsPromises.push(asset.save());
  }

  await Promise.all(assetsPromises);

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