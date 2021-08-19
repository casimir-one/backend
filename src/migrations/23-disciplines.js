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

const config = require('./../config');

const mongoose = require('mongoose');
const Discipline = require('./../schemas/discipline');
const TenantProfile = require('./../schemas/tenant');
const ChainService = require('@deip/chain-service').ChainService;

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi()

  const tenantProfiles = await TenantProfile.find({});
  const chainDisciplines = await chainApi.lookupDisciplinesAsync(0, 10000);
  const disciplinesPromises = [];

  for (let i = 0; i < chainDisciplines.length; i++) {
    const chainDiscipline = chainDisciplines[i];

    const discipline = new Discipline({
      _id: chainDiscipline.external_id,
      parentExternalId: chainDiscipline.parent_external_id,
      name: chainDiscipline.name,
      tenantId: config.TENANT,
      multiTenantIds: [...tenantProfiles.map(t => t._id.toString())]
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