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

  const chainResearchGroups = await deipRpc.api.lookupResearchGroupsAsync(1, 10000);

  const researchGroupsPromises = [];


  for (let i = 0; i < chainResearchGroups.length; i++) {
    const chainResearchGroup = chainResearchGroups[i];

    const researchGroup = new ResearchGroup({
      _id: chainResearchGroup.external_id,
      creator: chainResearchGroup.creator,
      researchAreas: [
        {
          "title": "Biological Sciences (BIO)",
          "abbreviation": "nsf",
          "subAreaAbbreviation": "nsf",
          "disciplines": [
            1,
            3,
            9
          ],
          "subAreas": [
            {
              "title": "Molecular and Cellular Biosciences (MCB)",
              "abbreviation": "nsf",
              "subAreaAbbreviation": "nsf",
              "disciplines": [
                1,
                3,
                9
              ]
            },
            {
              "title": "Integrative Organismal Systems (IOS)",
              "abbreviation": "nsf",
              "subAreaAbbreviation": "nsf",
              "disciplines": [
                1,
                3,
                9
              ]
            },
            {
              "title": "Emerging Frontiers (EF)",
              "abbreviation": "nsf",
              "subAreaAbbreviation": "nsf",
              "disciplines": [
                1,
                3,
                9
              ]
            },
            {
              "title": "Environmental Biology (DEB)",
              "abbreviation": "nsf",
              "subAreaAbbreviation": "nsf",
              "disciplines": [
                1,
                3,
                9
              ]
            },
            {
              "title": "Biological Infrastructure (DBI)",
              "abbreviation": "nsf",
              "subAreaAbbreviation": "nsf",
              "disciplines": [
                1,
                3,
                9
              ]
            }
          ]
        }
      ]
    });

    researchGroupsPromises.push(researchGroup.save());
  }

  await Promise.all(researchGroupsPromises);

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


