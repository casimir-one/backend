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
const ResearchGroup = require('./../schemas/researchGroup');

const ChainService = require('@deip/chain-service').ChainService;
const crypto = require('crypto');


mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);


const run = async () => {

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc()

  const chainResearchGroups = await chainRpc.lookupResearchGroupsAsync(1, 1000);

  const researchGroupsPromises = [];


  for (let i = 0; i < chainResearchGroups.length; i++) {
    const chainResearchGroup = chainResearchGroups[i];
    
    const meta = { name: chainResearchGroup.creator, description: chainResearchGroup.description };

    if (chainResearchGroup.external_id == "0000000000000000000000000000000000000000") {
      meta.name = "DEIP"
      meta.description = "DEIP official"
    } else if (chainResearchGroup.external_id == "a6d1a54f8ebbe1afe800feb65934c30194cd8576") {
      meta.name = "Chimera: Modeling social identity and group membership for use in digital media such as videogames and social media team"
      meta.description = ""
    } else if (chainResearchGroup.external_id == "1b82cf477e7669f29f69f06656467d1a674d2d43") {
      meta.name = "Efficient and reliable transmission of sparse signals in wireless sensor networks team"
      meta.description = ""
    } else if (chainResearchGroup.external_id == "63c44a2ca40aab336c643fafc079c300a5b186bf") {
      meta.name = "Enhanced flow boiling heat transfer in microchannels with structured surfaces team"
      meta.description = ""
    } else if (chainResearchGroup.external_id == "15f1ecc9beaca01cb5d826b0dac3c06d4d31b7c5") {
      meta.name = "Long-circulating Theranostics Agents for Highly Metastatic Tumors team"
      meta.description = ""
    } else if (chainResearchGroup.external_id == "b883480f95ad3eec2909288d7127ae7cf1126263") {
      meta.name = "Obstetric Quality of Recovery-10 scoring tool team"
      meta.description = ""
    } else if (chainResearchGroup.external_id == "58e3bfd753fcb860a66b82635e43524b285ab708") {
      meta.name = "The National Science Foundation"
      meta.description = "The National Science Foundation (NSF) is an independent federal agency created by Congress in 1950 to promote the progress of science; to advance the national health, prosperity, and welfare; to secure the national defense."
    } else if (chainResearchGroup.external_id == "c8657fa6cbaee3917ac4e2ed6ada9d0a55a15ac5") {
      meta.name = "NSF Grants Review Committee"
      meta.description = "The Grant Review Committee is established to evaluate applications for funding from NSF Grants Program."
    } else if (chainResearchGroup.external_id == "c8a87b12c23f53866acd397f43b591fd4e631419") {
      meta.name = "Massachusetts Institute of Technology"
      meta.description = "Founded to accelerate the nation’s industrial revolution, MIT is profoundly American. With ingenuity and drive, our graduates have invented fundamental technologies, launched new industries, and created millions of American jobs."
    } else if (chainResearchGroup.external_id == "1169d704f8a908016033efe8cce6df93f618a265") {
      meta.name = "United States Department of the Treasury"
      meta.description = "The Department of the Treasury (USDT) is an executive department and the treasury of the United States federal government. Established by an Act of Congress in 1789 to manage government revenue,[3] the Treasury prints all paper currency and mints all coins in circulation through the Bureau of Engraving and Printing and the United States Mint, respectively; collects all federal taxes through the Internal Revenue Service; manages U.S. government debt instruments; licenses and supervises banks and thrift institutions; and advises the legislative and executive branches on matters of fiscal policy."
    }

    const hash = crypto.createHash('sha256').update(JSON.stringify(meta)).digest("hex");

    console.log({ id: chainResearchGroup.external_id, hash });

    const researchGroup = new ResearchGroup({
      _id: chainResearchGroup.external_id,
      creator: chainResearchGroup.creator,
      name: meta.name,
      description: meta.description,
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


