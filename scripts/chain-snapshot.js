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
const queue = require('queue')


const CHAIN_CONSTANTS = require('./../constants/chainConstants').default;
const { RESEARCH_CONTENT_TYPES } = require('./../constants');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);



const blackListUsers = ['regacc', 'simonarataj'];
const newDisciplines = [
  {
    "name": "Information Technology",
    "external_id": "fd60bc92d9255aa27f356c3381ad84c6f29220a8",
    "external_parent_id": ""
  },
  {
    "name": "Finance",
    "external_id": "bd2f73aa965f1b49da800656cd37abfade9898db",
    "parent_external_id": ""
  },
  {
    "name": "Music Industry",
    "external_id": "073ac406ef75dc83d577add7e87488ff40b45848",
    "parent_external_id": ""
  },
  {
    "name": "Microscopy",
    "external_id": "a34214092025a3ca79097a7c13dd8011d74e7336",
    "parent_external_id": ""
  }
];


var genesisJSON;

const run = async ({ 
  TENANT, 
  DEIP_FULL_NODE_URL, 
  CHAIN_ID, 
  DEIP_MONGO_STORAGE_CONNECTION_URL, 
  NEW_DEIP_MONGO_STORAGE_CONNECTION_URL,
  DEIP_SERVER_URL
}) => {
  const deipRpc = require('@deip/rpc-client');
  deipRpc.api.setOptions({ url: DEIP_FULL_NODE_URL });
  deipRpc.config.set('chain_id', CHAIN_ID);

  // ONCHAIN DATA

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
    acc[first.research_group.external_id] = rgts.map(rgt => rgt.owner).filter(owner => !blackListUsers.some(name => name == owner));
    return acc;
  }, {});

  const chainResearchContentsReviewsByResearch = await Promise.all(chainResearches.map(r => deipRpc.api.getReviewsByResearchAsync(r.external_id)));
  const chainResearchContentsReviews = [].concat.apply([], chainResearchContentsReviewsByResearch);

  const chainAssets = await deipRpc.api.lookupAssetsAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
  const chainDisciplines = await deipRpc.api.lookupDisciplinesAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);

  const snapshotUsers = chainUserAccounts.filter(a => !blackListUsers.some(name => name == a.name) && !genesisJSON.accounts.some(ac => ac.name == a.name)).map(a => {
    const key = a.owner.key_auths[0][0];
    return {
      "name": a.name,
      "recovery_account": a.recovery_account,
      "public_key": key
    }
  });
  
  const snapshotDisciplines = [chainDisciplines, ...newDisciplines].filter(d => !genesisJSON.disciplines.some(discipline => discipline.external_id == d.external_id)).map((discipline) => {
    return {
      "name": discipline.name,
      "external_id": discipline.external_id,
      "external_parent_id": discipline.parent_external_id
    };
  });

  const snapshotAssets = chainAssets.filter(a => a.string_symbol != 'DEIP' && !genesisJSON.assets.some(asset => asset.symbol == a.string_symbol)).map((asset) => {
    return {
      "symbol": asset.string_symbol,
      "precision": asset.precision,
      "current_supply": asset.current_supply
    };
  });
  
  const snapshotResearchGroups = chainResearchGroups.filter(rg => !rg.is_personal && !genesisJSON.research_groups.some(researchGroup => researchGroup.account == rg.account)).map(rg => {
    return {
      "account": rg.external_id,
      "creator": rg.creator,
      "description": rg.description,
      "members": chainResearchGroupMembershipTokensMap[rg.external_id],
      "tenant": TENANT
    }
  });

  const snapshotResearches = chainResearches.map(r => {
    return {
      "external_id": r.external_id,
      "account": r.research_group.external_id,
      "description": r.description,
      "is_finished": r.is_finished,
      "is_private": r.is_private,
      "members": r.members.filter(member => !blackListUsers.some(name => name == member)),
      "disciplines": r.disciplines.map(d => {
        if (r.external_id == "51e9dbd5851124cdc853f163a67aeb61ee775967") {
          return "fd60bc92d9255aa27f356c3381ad84c6f29220a8";
        }
        if (r.external_id == "c1525afb6f39d76a094d8875c043cf6b00e4fb7d") {
          return "bd2f73aa965f1b49da800656cd37abfade9898db";
        }
        if (r.external_id == "f22f619c1911c38a89c01df97fe2bf881b8edab3") {
          return "073ac406ef75dc83d577add7e87488ff40b45848";
        }
        return d.external_id;
      })
    }
  });

  const snapshotResearchContents = chainResearchContents.map(rc => {
    const research = chainResearches.find(r => r.external_id == rc.research_external_id);
    return {
      "external_id": rc.external_id,
      "research_external_id": research.external_id,
      "description": rc.description,
      "content": rc.content,
      "type": RESEARCH_CONTENT_TYPES[rc.content_type.toUpperCase()],
      "authors": rc.authors.filter(author => !blackListUsers.some(name => name == author)),
      "references": rc.references
    }
  });

  const snapshotResearchContentReviews = chainResearchContentsReviews.filter(r => !blackListUsers.some(name => name == r.author) && !genesisJSON.research_contents_reviews.some(review => review.external_id == r.external_id)).map(review => {
    return {
      "external_id": review.external_id,
      "research_content_external_id": review.research_content_external_id,
      "content": review.content,
      "author": review.author,
      "disciplines": review.disciplines.map(d => d.external_id),
      "scores": review.scores
    }
  });
  
  genesisJSON.accounts.push(...snapshotUsers);
  genesisJSON.disciplines.push(...snapshotDisciplines);
  genesisJSON.assets.push(...snapshotAssets);
  genesisJSON.research_groups.push(...snapshotResearchGroups);
  genesisJSON.researches.push(...snapshotResearches);
  genesisJSON.research_contents.push(...snapshotResearchContents);
  genesisJSON.research_contents_reviews.push(...snapshotResearchContentReviews);


  // OFFCHAIN DATA
  const mongoose = require('mongoose');
  await mongoose.connect(DEIP_MONGO_STORAGE_CONNECTION_URL);
  const collections = await mongoose.connection.db.collections();
  const collectionsMap = collections.reduce((map, collection) => {
    map[collection.collectionName] = [];
    return map;
  }, {});
  const collectionsNames = Object.keys(collectionsMap);

  const tenantSettingsStr = await readFile('./tenant.settings.json', 'utf8');
  const tenantSettings = JSON.parse(tenantSettingsStr);

  const docs = await Promise.all(collections.map(collection => collection.find({}).toArray()));
  for (let i = 0; i < collectionsNames.length; i++) {
    let collectionName = collectionsNames[i];
    collectionsMap[collectionName].push(...docs[i].map((doc) => {
      if (collectionName == 'tenants-profiles') {
        return { ...doc, tenantSettings, serverUrl: DEIP_SERVER_URL, network: { ...doc.network, nodes: [], scope: [] } }
      }
      else if (collectionName == 'proposals') {
        return { ...doc, tenantId: TENANT, multiTenantIds: [TENANT] }
      }
      else if (collectionName == 'user-notifications') {
        if (blackListUsers.some(name => doc.username == name)) {
          return null;
        }
        return { ...doc, tenantId: TENANT, multiTenantIds: [TENANT] }
      }
      else if (collectionName == 'research-contents') {
        return { ...doc, tenantId: TENANT, multiTenantIds: [TENANT], authors: doc.authors.filter(a => !blackListUsers.some(name => a == name)), }
      }
      else if (collectionName == 'user-profiles') {
        if (blackListUsers.some(name => doc._id == name)) {
          return null;
        }
      }
      else if (collectionName == 'research-groups') {
        if (blackListUsers.some(name => doc._id == name)) {
          return null;
        }
      }
      else if (collectionName == 'reviews') {
        if (blackListUsers.some(name => doc.author == name)) {
          return null;
        }
        const researchContent = snapshotResearchContents.find(researchContent => researchContent.external_id == doc.researchContentExternalId)
        return { ...doc, tenantId: TENANT, researchExternalId: researchContent.research_external_id };
      }
      else if (collectionName == 'review-requests') {
        if (blackListUsers.some(name => doc.expert == name || doc.requestor == name)) {
          return null;
        }
      }
      else if (collectionName == 'user-invites') {
        if (blackListUsers.some(name => doc.invitee == name || doc.creator == name)) {
          return null;
        }
      }
      else if (collectionName == 'user-bookmarks') {
        if (blackListUsers.some(name => doc.username == name)) {
          return null;
        }
      }
      
      return { ...doc, tenantId: TENANT };
      
    }).filter(doc => !!doc));
  }

  await mongoose.disconnect();

  await mongoose.connect(NEW_DEIP_MONGO_STORAGE_CONNECTION_URL);
  const collections2 = await mongoose.connection.db.collections();
  const collections2Names = collections2.map(collection => collection.collectionName);

  await Promise.all(collections2.map(collection => collection.collectionName == 'tenants-profiles' ? collection.deleteOne({ _id: TENANT }) : collection.deleteMany({ tenantId: TENANT })));
  await Promise.all(collectionsNames.filter(collectionName => !collections2Names.some(name => name == collectionName)).map(collectionName => mongoose.connection.db.createCollection(collectionName)));
  await Promise.all(collectionsNames.map(collectionName => collectionsMap[collectionName].length ? mongoose.connection.db.collection(collectionName).insertMany(collectionsMap[collectionName]) : Promise.resolve()));
  await mongoose.disconnect();
};


const q = queue({ concurrency: 1 });

const network = [
  {
    TENANT: "fa81a9ab079d34b383db5935ce18cafc96f36dc5",
    DEIP_FULL_NODE_URL: "https://jcu-full-node.deip.world",
    CHAIN_ID: "fdbdb6f9c06b03e53e4f1dc2b6cecc09807ac7a418a93a2bfd2b907a56df4c36",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:<password>@jcu-web-server.deip.world:27017/deip-server?authSource=admin",
    NEW_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://127.0.0.1:27017/deip-dev-server?authSource=admin",
    DEIP_SERVER_URL: "https://jcu-web-server.deip.world"
  }, {
    TENANT: "00067e21d5b12b2393677e87d3fbbc52adcfbb28",
    DEIP_FULL_NODE_URL: "https://uni-lj-full-node.deip.world",
    CHAIN_ID: "ef3e761d1489f7b954774d8f1429c49a1d5df9a8a1d0e058adf37abeb3bfcfd4",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:<password>@uni-lj-web-server.deip.world:27017/deip-server?authSource=admin",
    NEW_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://127.0.0.1:27017/deip-dev-server?authSource=admin",
    DEIP_SERVER_URL: "https://uni-lj-web-server.deip.world"
  }, {
    TENANT: "e7b3aabc542e77062b599d24a00b60ea6122850d",
    DEIP_FULL_NODE_URL: "https://geiger-full-node.deip.world",
    CHAIN_ID: "62181dd6d9133ed981f62c0f1619371b1e510ff9f5b365416b00f2b6ca742aff",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:<password>@geiger-web-server.deip.world:27017/deip-server?authSource=admin",
    NEW_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://127.0.0.1:27017/deip-dev-server?authSource=admin",
    DEIP_SERVER_URL: "https://geiger-web-server.deip.world"
  }, {
    TENANT: "8c5081e73c0af4c232a78417bc1b573ebe70c40c",
    DEIP_FULL_NODE_URL: "https://ariel-full-node.deip.world",
    CHAIN_ID: "6720f2f4bdd1dce1f8ec37de9b4cd383bf624aacdbdca5b8cf260d0ae55cd327",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:<password>@ariel-web-server.deip.world:27017/deip-server?authSource=admin",
    NEW_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://127.0.0.1:27017/deip-dev-server?authSource=admin",
    DEIP_SERVER_URL: "https://ariel-web-server.deip.world"
  }
];

q.push(

  ...[
    
    async function (cb) {
      try {
        const genesisJSONStr = await readFile('./genesis.json', 'utf8');
        genesisJSON = JSON.parse(genesisJSONStr);
        cb(null, 0);
      } catch (err) {
        cb(err, 1);
      }
    },

    ...network.map((conf) => {
      return async function (cb) {
        try {
          await run(conf);
          console.log(`Successfully finished for ${conf.TENANT}`);
          cb(null, 0);
        } catch (err) {
          cb(err, 1);
        }
      };
    }),

    async function (cb) {
      try {
        await writeFile(`./genesis-${new Date(Date.now()).toISOString()}.json`, JSON.stringify(genesisJSON, null, 2));
        cb(null, 0);
      } catch (err) {
        cb(err, 1);
      }
    }

  ]
);


q.start(function (err) {
  if (err) {
    console.error(err);
    process.exit(1);
  } else {
    console.log('Migration finished');
    process.exit(0);
  }
});