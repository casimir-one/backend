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

const config = require('./../config');
const mongoose = require('mongoose');
const Domain = require('./../schemas/DomainSchema');
const { ChainService } = require('@deip/chain-service');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  const chainDomains = await chainRpc.lookupDomainsAsync(0, 10000);
  const domainsPromises = [];

  for (let i = 0; i < chainDomains.length; i++) {
    const chainDomain = chainDomains[i];

    const domain = new Domain({
      _id: chainDomain.external_id,
      parentId: chainDomain.parent_external_id,
      name: chainDomain.name,
      isGlobalScope: true
    });

    domainsPromises.push(domain.save());
  }

  await Promise.all(domainsPromises);

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