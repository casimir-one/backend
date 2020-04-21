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
const researchContentService = require('./../services/researchContent');
const deipRpc = require('@deip/rpc-client');

deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);

const run = async () => {
  let list = await deipRpc.api.getAllResearchesListingAsync(0, 0);
  let researches = await Promise.all(list.map(research => deipRpc.api.getResearchByIdAsync(research.research_id)));
  let researchesContents = await Promise.all(list.map(research => deipRpc.api.getAllResearchContentAsync(research.research_id)));
  let researchesContentsList = [].concat.apply([], researchesContents);
  let researchesContentsRms = await Promise.all(researchesContentsList.map(rc => researchContentService.findResearchContentByHashLegacy(rc.research_id, rc.content)));
  let researchGroups = await Promise.all(list.map(research => deipRpc.api.getResearchGroupByIdAsync(research.group_id)));

  let removePromises = [];
  let upsertPromises = [];

  for (let i = 0; i < researchesContentsList.length; i++) {

    let researchesContentRm = researchesContentsRms[i];
    let researchContent = researchesContentsList[i];

    let research = researches.find(r => r.id == researchContent.research_id);
    let researchGroup = researchGroups.find(r => r.id == research.research_group_id);

    let hash = researchContent.content;

    removePromises.push(researchContentService.removeResearchContentByHashLegacy(researchContent.research_id, hash));
    upsertPromises.push(researchContentService.upsertResearchContent({
      externalId: researchContent.external_id,
      researchExternalId: research.external_id,
      researchGroupExternalId: researchGroup.account.name,
      folder: researchesContentRm.folder,
      researchId: research.id,
      researchGroupId: researchGroup.id,
      title: researchContent.title,
      permlink: researchContent.permlink,
      hash: hash,
      algo: researchesContentRm.algo,
      type: researchesContentRm.type,
      status: researchesContentRm.status,
      packageFiles: researchesContentRm.packageFiles,
      authors: researchesContentRm.authors,
      references: researchesContentRm.references,
      foreignReferences: researchesContentRm.foreignReferences
    }));
  }

  await Promise.all(removePromises);
  await Promise.all(upsertPromises);

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

