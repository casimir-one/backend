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

const fs = require('fs');
const util = require('util');
const queue = require('queue')
const CryptoJS = require("crypto-js");


const CHAIN_CONSTANTS = require('./../constants/chainConstants').default;
const { RESEARCH_CONTENT_TYPES, RESEARCH_STATUS } = require('./../constants');

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


const networkAccessAttr = {
  "_id": "5f69be12ae115a26e475fb96",
  "isFilterable": false,
  "isEditable": false,
  "isRequired": true,
  "isHidden": false,
  "isMultiple": false,
  "defaultValue": true,
  "isBlockchainMeta": false,
  "valueOptions": [],
  "type": "network-content-access",
  "title": "Network content access",
  "shortTitle": "Network content access",
  "description": "",
  "blockchainFieldMeta": null
};


const privateAttr = {
  "_id": "5f68d4fa98f36d2938dde5ec",
  "isFilterable": false,
  "isEditable": true,
  "isRequired": true,
  "isHidden": false,
  "isMultiple": false,
  "defaultValue": true,
  "isBlockchainMeta": false,
  "valueOptions": [],
  "type": "switch",
  "title": "Private project",
  "shortTitle": "Private project",
  "description": "",
  "blockchainFieldMeta": {
    "isPartial": false,
    "field": "is_private"
  }
};

var genesisJSON;

const run = async ({ 
  TENANT, 
  DEIP_FULL_NODE_URL, 
  CHAIN_ID, 
  DEIP_MONGO_STORAGE_CONNECTION_URL, 
  TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL,
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
  const chainProposalsStates = await deipRpc.api.lookupProposalsStatesAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
  const chainAssetsBallances = await Promise.all(chainAssets.map(chainAsset => deipRpc.api.getAccountsAssetBalancesByAssetAsync(chainAsset.string_symbol)));

  const snapshotUsers = chainUserAccounts.filter(a => !blackListUsers.some(name => name == a.name) && !genesisJSON.accounts.some(ac => ac.name == a.name)).map(a => {
    const key = a.owner.key_auths[0][0]; // "DEIP7cqzf9qxb9NEkXCJQjNEsGCHG48ywEqkrcaT3owTynHr828mso";
    return {
      "name": a.name,
      "recovery_account": a.recovery_account,
      "public_key": key
    }
  });
  
  const snapshotDisciplines = [...chainDisciplines, ...newDisciplines].filter(d => !genesisJSON.disciplines.some(discipline => discipline.external_id == d.external_id)).map((discipline) => {
    return {
      "name": discipline.name,
      "external_id": discipline.external_id,
      "external_parent_id": discipline.parent_external_id
    };
  });

  const snapshotAssets = chainAssets.filter(a => a.string_symbol != 'DEIP' && a.string_symbol != 'TESTS' && !genesisJSON.assets.some(asset => asset.symbol == a.string_symbol)).map((asset) => {
    return {
      "symbol": asset.string_symbol,
      "precision": asset.precision,
      "current_supply": asset.current_supply
    };
  });


  
  const snapshotResearchGroups = chainResearchGroups.filter(rg => !rg.is_personal && !genesisJSON.research_groups.some(researchGroup => researchGroup.account == rg.account)).map(rg => {
    
    function getKeys() {
      const { owner: privKey, ownerPubkey: pubKey } = deipRpc.auth.getPrivateKeys(
        CryptoJS.lib.WordArray.random(32),
        CryptoJS.lib.WordArray.random(32),
        ['owner']
      );

      console.log(TENANT + " ---> ", { privKey, pubKey });
      return { privKey, pubKey };
    }

    const public_key = rg.external_id == TENANT ? getKeys().pubKey : undefined;
    // const public_key = rg.external_id == "fa81a9ab079d34b383db5935ce18cafc96f36dc5" ? "DEIP8G25xQk3dPCdBqdihEppiZ4Rjw7Dcc5DbjGgX6tDgWFL29zepJ"
    //   : rg.external_id == "00067e21d5b12b2393677e87d3fbbc52adcfbb28" ? "DEIP8FiSkbrAEHtk3GMLjEi23kdiG8QRNbUrjcC4vHasTM8FQmanNd"
    //   : rg.external_id == "e7b3aabc542e77062b599d24a00b60ea6122850d" ? "DEIP8feUU1MigFXQtd5aebrrucQZx4QiaWn6WCJR5a2re1zZbDPzny"
    //   : rg.external_id == "8c5081e73c0af4c232a78417bc1b573ebe70c40c" ? "DEIP5f4JLkEhGVxzbkXVqcaYXRJ4o9C4GbBJyP3FYyyMn5EY2Trs5U" 
    //   : undefined;

    return {
      "account": rg.external_id,
      "creator": rg.creator,
      "description": rg.description,
      "members": chainResearchGroupMembershipTokensMap[rg.external_id],
      "tenant": TENANT,
      "public_key": public_key
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

  const plus3years = new Date(new Date().getTime() + 86400000 * 365 * 3).toISOString().split('.')[0]; // 3 years
  const expirationTime = `${plus3years.split('T')[0]}T00:00:00`;
  
  const snapshotProposals = chainProposalsStates.filter((p) => p.status == 1 || p.status == 5).map((p) => {
    return {
      external_id: p.external_id,
      proposer: p.proposer,
      review_period_seconds: p.review_period_seconds ? p.review_period_seconds : undefined,
      expiration_time: expirationTime,
      active_approvals: p.active_approvals,
      owner_approvals: p.owner_approvals,
      key_approvals: p.key_approvals,
      serialized_proposed_transaction: p.serialized_proposed_transaction
    }
  });

  const outdatedProposals = chainProposalsStates.filter((p) => p.status != 1 && p.status != 5).map((p) => p.external_id);

  let init_supply = 0;
  const snapshotAccountBallances = [].concat.apply([], chainAssetsBallances.map((chainAssetBallances) => {
    const balances = chainAssetBallances.map((chainAssetBallance) => {
      const [stringAmount, symbol] = chainAssetBallance.amount.split(' ');
      const amount = parseInt(stringAmount.replace('.', ''));
      const isCoreAsset = symbol == 'DEIP' || symbol == 'TESTS';
      if (isCoreAsset) {
        init_supply += amount;
      }
      return {
        "owner": chainAssetBallance.owner,
        "amount": amount,
        "symbol": isCoreAsset ? undefined : symbol,
        "tokenized_research": chainAssetBallance.tokenized_research || undefined
      };
    });

    return balances;
  })); 
  snapshotAccountBallances.sort((a, b) => (a.owner > b.owner) ? 1 : ((b.owner > a.owner) ? -1 : 0))

  genesisJSON.init_supply = init_supply;
  genesisJSON.accounts.push(...snapshotUsers);
  genesisJSON.disciplines.push(...snapshotDisciplines);
  genesisJSON.assets.push(...snapshotAssets);
  genesisJSON.account_balances.push(...snapshotAccountBallances);
  genesisJSON.research_groups.push(...snapshotResearchGroups);
  genesisJSON.researches.push(...snapshotResearches);
  genesisJSON.research_contents.push(...snapshotResearchContents);
  genesisJSON.research_contents_reviews.push(...snapshotResearchContentReviews);
  genesisJSON.proposals.push(...snapshotProposals);


  // OFFCHAIN DATA
  const mongoose = require('mongoose');
  await mongoose.connect(DEIP_MONGO_STORAGE_CONNECTION_URL);
  const collections = await mongoose.connection.db.collections();
  const collectionsDocsMap = collections.reduce((map, collection) => {
    map[collection.collectionName] = [];
    return map;
  }, {});
  const collectionsNames = Object.keys(collectionsDocsMap);

  const tenantSettingsStr = await readFile('./tenant.settings.json', 'utf8');
  const tenantSettings = JSON.parse(tenantSettingsStr);

  const oldTenantDoc = await mongoose.connection.db.collection('tenants-profiles').findOne({ _id: TENANT });
  const oldSettings = oldTenantDoc.settings;

  const docs = await Promise.all(collections.map(collection => collection.find({}).toArray()));
  for (let i = 0; i < collectionsNames.length; i++) {
    let collectionName = collectionsNames[i];
    collectionsDocsMap[collectionName].push(...docs[i].map((doc) => {
      if (collectionName == 'tenants-profiles') {
        if (doc._id == "8c5081e73c0af4c232a78417bc1b573ebe70c40c") {
          return { ...doc, name: "Ariel Scientific Innovations Ltd", shortName: "Ariel Scientific Innovations Ltd", settings: { ...tenantSettings, researchAttributes: [...doc.settings.researchAttributes.filter(attr => attr._id != privateAttr._id), networkAccessAttr, privateAttr] }, serverUrl: DEIP_SERVER_URL, network: { ...doc.network, nodes: [], scope: [] } }
        }
        return { ...doc, settings: { ...tenantSettings, researchAttributes: [...doc.settings.researchAttributes.filter(attr => attr._id != privateAttr._id), networkAccessAttr, privateAttr ] }, serverUrl: DEIP_SERVER_URL, network: { ...doc.network, nodes: [], scope: [] } }
      }
      else if (collectionName == 'proposals') {
        if (outdatedProposals.some(id => doc._id == id)) {
          return null;
        }
        return { ...doc, tenantId: TENANT, multiTenantIds: [TENANT] }
      }
      else if (collectionName == 'user-notifications') {
        if (blackListUsers.some(name => doc.username == name)) {
          return null;
        }
        return { ...doc, tenantId: TENANT, multiTenantIds: [TENANT] }
      }
      else if (collectionName == 'researches') {
        const attributes = doc.attributes;
        const disciplinesAttrId = "5f62d4fa98f46d2938dde1eb";

        if (!attributes.some(attr => attr.researchAttributeId == privateAttr._id)) {
          attributes.push({
            researchAttributeId: privateAttr._id,
            value: false
          });
        }
        
        if (doc._id == "51e9dbd5851124cdc853f163a67aeb61ee775967") {
          const disciplinesAttr = attributes.find(attr => attr.researchAttributeId == disciplinesAttrId);
          disciplinesAttr.value = ["fd60bc92d9255aa27f356c3381ad84c6f29220a8"]; 
        }

        if (doc._id == "c1525afb6f39d76a094d8875c043cf6b00e4fb7d") {
          const disciplinesAttr = attributes.find(attr => attr.researchAttributeId == disciplinesAttrId);
          disciplinesAttr.value = ["bd2f73aa965f1b49da800656cd37abfade9898db"];
        }

        if (doc._id == "f22f619c1911c38a89c01df97fe2bf881b8edab3") {
          const disciplinesAttr = attributes.find(attr => attr.researchAttributeId == disciplinesAttrId);
          disciplinesAttr.value = ["073ac406ef75dc83d577add7e87488ff40b45848"];
        }

        return { ...doc, attributes: attributes, tenantId: TENANT, status: oldSettings.researchBlacklist.some(id => id == doc._id) ? RESEARCH_STATUS.DELETED : doc.status, tenantCriterias: undefined, milestones: undefined, partners: undefined }
      }
      else if (collectionName == 'research-contents') {
        return { ...doc, tenantId: TENANT, multiTenantIds: [TENANT], authors: doc.authors.filter(a => !blackListUsers.some(name => a == name)) }
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
        if (doc._id == "8c5081e73c0af4c232a78417bc1b573ebe70c40c") {
          return { ...doc, name: "Ariel Scientific Innovations Ltd", tenantId: TENANT };
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
        if (outdatedProposals.some(id => doc._id == id)) {
          return null;
        }
        return { ...doc, tenantId: TENANT, expiration: new Date(new Date().getTime() + 86400000 * 365 * 3) }
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

  await mongoose.connect(TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL);
  const collections2 = await mongoose.connection.db.collections();
  const collections2Names = collections2.map(collection => collection.collectionName);

  await Promise.all(collections2.map(collection => collection.collectionName == 'tenants-profiles' ? collection.deleteOne({ _id: TENANT }) : collection.deleteMany({ tenantId: TENANT })));
  await Promise.all(collectionsNames.filter(collectionName => !collections2Names.some(name => name == collectionName)).map(collectionName => mongoose.connection.db.createCollection(collectionName)));
  await Promise.all(collectionsNames.map(collectionName => collectionsDocsMap[collectionName].length ? mongoose.connection.db.collection(collectionName).insertMany(collectionsDocsMap[collectionName]) : Promise.resolve()));
  await mongoose.disconnect();
};


const q = queue({ concurrency: 1 });

const network = [
  {
    TENANT: "fa81a9ab079d34b383db5935ce18cafc96f36dc5",
    // DEIP_FULL_NODE_URL: "https://jcu-full-node.deip.world",
    // DEIP_FULL_NODE_URL: "http://127.0.0.1:9092",
    DEIP_FULL_NODE_URL: "http://127.0.0.1:7093",
    CHAIN_ID: "fdbdb6f9c06b03e53e4f1dc2b6cecc09807ac7a418a93a2bfd2b907a56df4c36",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:t5LMx2jHMTKk7kvX@jcu-web-server.deip.world:27017/deip-server?authSource=admin",
    TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:DdBXtegQ9bvmR3FD@tto-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-wip?authSource=admin",
    DEIP_SERVER_URL: "https://jcu-web-server.deip.world"
    // DEIP_SERVER_URL: "https://jcu-testnet-web-server.deip.co"
  }, {
    TENANT: "00067e21d5b12b2393677e87d3fbbc52adcfbb28",
    // DEIP_FULL_NODE_URL: "https://uni-lj-full-node.deip.world",
    // DEIP_FULL_NODE_URL: "http://127.0.0.1:9093",
    DEIP_FULL_NODE_URL: "http://127.0.0.1:7094",
    CHAIN_ID: "ef3e761d1489f7b954774d8f1429c49a1d5df9a8a1d0e058adf37abeb3bfcfd4",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:yDC3A76cTF@uni-lj-web-server.deip.world:27017/deip-server?authSource=admin",
    TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:DdBXtegQ9bvmR3FD@tto-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-wip?authSource=admin",
    DEIP_SERVER_URL: "https://uni-lj-web-server.deip.world"
    // DEIP_SERVER_URL: "https://uni-lj-testnet-web-server.deip.co"
  }, {
    TENANT: "e7b3aabc542e77062b599d24a00b60ea6122850d",
    // DEIP_FULL_NODE_URL: "https://geiger-full-node.deip.world",
    // DEIP_FULL_NODE_URL: "http://127.0.0.1:9091",
    DEIP_FULL_NODE_URL: "http://127.0.0.1:7092",
    CHAIN_ID: "62181dd6d9133ed981f62c0f1619371b1e510ff9f5b365416b00f2b6ca742aff",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:Qc3HzKtYmE@geiger-web-server.deip.world:27017/deip-server?authSource=admin",
    TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:DdBXtegQ9bvmR3FD@tto-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-wip?authSource=admin",
    DEIP_SERVER_URL: "https://geiger-web-server.deip.world"
    // DEIP_SERVER_URL: "https://geiger-testnet-web-server.deip.co"
  }, {
    TENANT: "8c5081e73c0af4c232a78417bc1b573ebe70c40c",
    // DEIP_FULL_NODE_URL: "https://ariel-full-node.deip.world",
    // DEIP_FULL_NODE_URL: "http://127.0.0.1:9090",
    DEIP_FULL_NODE_URL: "http://127.0.0.1:7091",
    CHAIN_ID: "6720f2f4bdd1dce1f8ec37de9b4cd383bf624aacdbdca5b8cf260d0ae55cd327",
    DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:UBuw7WD3yy@ariel-web-server.deip.world:27017/deip-server?authSource=admin",
    TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:DdBXtegQ9bvmR3FD@tto-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-network?authSource=admin",
    // TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL: "mongodb://deip:XTFEaoBKqYr@dev-mongodb.deip.world:27017/deip-tto-wip?authSource=admin",
    DEIP_SERVER_URL: "https://ariel-web-server.deip.world"
    // DEIP_SERVER_URL: "https://ariel-testnet-web-server.deip.co"
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