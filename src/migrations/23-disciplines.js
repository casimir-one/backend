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
const Discipline = require('./../schemas/DomainSchema');
const { ChainService } = require('@deip/chain-service');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  const chainDisciplines = await chainRpc.lookupDisciplinesAsync(0, 10000);
  const disciplinesPromises = [];

  for (let i = 0; i < chainDisciplines.length; i++) {
    const chainDiscipline = chainDisciplines[i];

    const discipline = new Discipline({
      _id: chainDiscipline.external_id,
      parentExternalId: chainDiscipline.parent_external_id,
      name: chainDiscipline.name,
      isGlobalScope: true
    });

    disciplinesPromises.push(discipline.save());
  }

  await Promise.all(disciplinesPromises);

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