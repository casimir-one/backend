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

const fs = require('fs');
const util = require('util');


// const mongoose = require('mongoose');
const deipRpc = require('@deip/rpc-client');
const CHAIN_CONSTANTS = require('./../constants/chainConstants').default;
const RESEARCH_CONTENT_TYPES = require('./../constants/researchContentType').default;


deipRpc.api.setOptions({ url: config.DEIP_FULL_NODE_URL });
deipRpc.config.set('chain_id', config.CHAIN_ID);

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);


const run = async () => {

  const genesisJSONStr = await readFile('./genesis.json', 'utf8');
  const genesisJSON = JSON.parse(genesisJSONStr);

  const chainAccounts = await deipRpc.api.lookupAccountsAsync('0', CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
  const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);
  const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);

  const chainResearchGroups = await deipRpc.api.lookupResearchGroupsAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
  const chainResearches = await deipRpc.api.lookupResearchesAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
  const chainResearchContentsByResearch = await Promise.all(chainResearches.map(r => deipRpc.api.getResearchContentsByResearchAsync(r.external_id)));
  const chainResearchContents = [].concat.apply([], chainResearchContentsByResearch);
  const chainResearchGroupMembershipTokensByResearchGroup = await Promise.all(chainResearchGroups.map(rg => deipRpc.api.getResearchGroupMembershipTokensAsync(rg.external_id)));
  const chainResearchGroupMembershipTokensMap = chainResearchGroupMembershipTokensByResearchGroup.reduce((acc, rgts) => {
    const [first, ...rest] = rgts;
    acc[first.research_group.external_id] = rgts.map(rgt => rgt.owner);
    return acc;
  }, {});

  const newUserAccounts = chainUserAccounts.filter(a => a.name != 'regacc' && !genesisJSON.accounts.some(ac => ac.name == a.name)).map(a => {

    const key = a.owner.key_auths[0][0];
    return {
      "name": a.name,
      "recovery_account": a.recovery_account,
      "public_key": key
    }
  });

  genesisJSON.accounts.push(...newUserAccounts);

  
  const snapshotResearchGroups = chainResearchGroups.filter(g => !g.is_personal).map(rg => {
    return {
      "account": rg.external_id,
      "creator": rg.creator,
      "description": rg.description,
      "members": chainResearchGroupMembershipTokensMap[rg.external_id],
      "subgroups": []
    }
  });

  const snapshotResearches = chainResearches.map(r => {
    return {
      "external_id": r.external_id,
      "account": r.research_group.external_id,
      "description": r.description,
      "is_finished": r.is_finished,
      "is_private": r.is_private,
      "members": r.members,
      "disciplines": r.disciplines.map(d => {
        return d.external_id;
      })
    }
  });

  const snapshotResearchContents = chainResearchContents.map(rc => {
    const research = chainResearches.find(r => r.id == rc.research_id);
    return {
      "external_id": rc.external_id,
      "research_external_id": research.external_id,
      "description": rc.description,
      "content": rc.content,
      "type": RESEARCH_CONTENT_TYPES[rc.content_type.toUpperCase()],
      "authors": rc.authors,
      "references": rc.references
    }
  });


  genesisJSON.research_groups.push(...snapshotResearchGroups);
  genesisJSON.researches.push(...snapshotResearches);
  genesisJSON.research_contents.push(...snapshotResearchContents);

  await writeFile(`./genesis-${new Date(Date.now()).toISOString()}.json`, JSON.stringify(genesisJSON, null, 2));
  
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
