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
const { PROJECT_CONTENT_TYPES, PROJECT_STATUS } = require('./../constants');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const ChainService = require('@deip/chain-service').ChainService;


const blackListUsers = ['regacc', 'simonarataj'];
const newDomains = [
  {
    "name": "Information Technology",
    "_id": "fd60bc92d9255aa27f356c3381ad84c6f29220a8",
    "parentId": ""
  },
  {
    "name": "Finance",
    "_id": "bd2f73aa965f1b49da800656cd37abfade9898db",
    "parentId": ""
  },
  {
    "name": "Music Industry",
    "_id": "073ac406ef75dc83d577add7e87488ff40b45848",
    "parentId": ""
  },
  {
    "name": "Microscopy",
    "_id": "a34214092025a3ca79097a7c13dd8011d74e7336",
    "parentId": ""
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
  PORTAL, 
  DEIP_FULL_NODE_URL, 
  CHAIN_ID, 
  DEIP_MONGO_STORAGE_CONNECTION_URL, 
  TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL,
  DEIP_SERVER_URL
}) => {

  const chainService = await ChainService.getInstanceAsync({ ...config, DEIP_FULL_NODE_URL, CHAIN_ID, });
  const chainNodeClient = chainService.getChainNodeClient();
  const chainRpc = chainService.getChainRpc();
  const deipRpc = chainNodeClient;

  // ONCHAIN DATA

  const chainAccounts = await chainRpc.getAccountsListAsync();
  const chainTeams = chainAccounts.filter(a => a.authority.owner.auths.length > 1);
  const chainUserAccounts = chainAccounts.filter(a => a.authority.owner.auths.length <= 1);
  const chainProjects = await chainRpc.getProjectsListAsync();
  const chainProjectContentsByProject = await Promise.all(chainProjects.map(r => chainRpc.getProjectContentsByProjectAsync(r._id)));
  const chainProjectContents = [].concat.apply([], chainProjectContentsByProject);
  const chainTeamMembers = await Promise.all(chainTeams.map(dao => chainRpc.getAccountMembersAsync(dao.daoId)));
  const chainTeamMembershipTokensMap = chainTeamMembers.reduce((acc, accounts, i) => {
    acc[chainTeams[i].daoId] = accounts[i].filter(a => !blackListUsers.some(name => name == a));
    return acc;
  }, {});

  const chainProjectContentsReviewsByProject = await Promise.all(chainProjects.map(r => chainRpc.getReviewsByProjectAsync(r._id)));
  const chainProjectContentsReviews = [].concat.apply([], chainProjectContentsReviewsByProject);

  const chainAssets = await chainRpc.getAssetsListAsync();
  const chainDomains = await chainRpc.lookupDomainsAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
  const chainProposalsStates = await chainRpc.lookupProposalsStatesAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
  const chainAssetsBallances = await Promise.all(chainAssets.map(chainAsset => chainRpc.getAssetBalancesByAssetSymbolAsync(chainAsset.symbol)));

  const snapshotUsers = chainUserAccounts.filter(a => !blackListUsers.some(name => name == a.name) && !genesisJSON.accounts.some(ac => ac.name == a.name)).map(a => {
    const key = a.authority.owner.auths
      .filter((auth) => !!auth.pubKey)
      .map((auth) => auth.pubKey)[0] || null; // "DEIP7cqzf9qxb9NEkXCJQjNEsGCHG48ywEqkrcaT3owTynHr828mso";
    
      return {
      "name": a.name,
      "recovery_account": a.recovery_account,
      "public_key": key
    }
  });

  const snapshotDomains = [...chainDomains, ...newDomains].filter(d => !genesisJSON.domains.some(domain => domain._id == d._id)).map((domain) => {
    return {
      "name": domain.name,
      "_id": domain._id,
      "parentId": domain.parentId
    };
  });

  const snapshotAssets = chainAssets.filter(a => a.string_symbol != 'DEIP' && a.string_symbol != 'TESTS' && !genesisJSON.assets.some(asset => asset.symbol == a.string_symbol)).map((asset) => {
    return {
      "symbol": asset.string_symbol,
      "precision": asset.precision,
      "current_supply": asset.current_supply
    };
  });


  
  const snapshotTeams = chainTeams.filter(rg => !genesisJSON.teams.some(team => team.account == rg.account)).map(rg => {

    function getKeys() {
      const { owner: privKey, ownerPubkey: pubKey } = deipRpc.auth.getPrivateKeys(
        CryptoJS.lib.WordArray.random(32),
        CryptoJS.lib.WordArray.random(32),
        ['owner']
      );

      console.log(PORTAL + " ---> ", { privKey, pubKey });
      return { privKey, pubKey };
    }

    const public_key = rg.daoId == PORTAL ? getKeys().pubKey : undefined;
    // const public_key = rg.daoId == "fa81a9ab079d34b383db5935ce18cafc96f36dc5" ? "DEIP8G25xQk3dPCdBqdihEppiZ4Rjw7Dcc5DbjGgX6tDgWFL29zepJ"
    //   : rg.daoId == "00067e21d5b12b2393677e87d3fbbc52adcfbb28" ? "DEIP8FiSkbrAEHtk3GMLjEi23kdiG8QRNbUrjcC4vHasTM8FQmanNd"
    //   : rg.daoId == "e7b3aabc542e77062b599d24a00b60ea6122850d" ? "DEIP8feUU1MigFXQtd5aebrrucQZx4QiaWn6WCJR5a2re1zZbDPzny"
    //   : rg.daoId == "8c5081e73c0af4c232a78417bc1b573ebe70c40c" ? "DEIP5f4JLkEhGVxzbkXVqcaYXRJ4o9C4GbBJyP3FYyyMn5EY2Trs5U"
    //   : undefined;

    return {
      "account": rg.daoId,
      "creator": rg.creator,
      "description": rg.description,
      "members": chainTeamMembershipTokensMap[rg.daoId],
      "portal": PORTAL,
      "public_key": public_key
    }
  });

  const snapshotProjects = chainProjects.map(r => {
    return {
      "_id": r._id,
      "account": r.teamId,
      "description": r.description,
      "is_finished": r.is_finished,
      "is_private": r.is_private,
      "members": r.members.filter(member => !blackListUsers.some(name => name == member)),
      "domains": r.domains.map(d => {
        if (r._id == "51e9dbd5851124cdc853f163a67aeb61ee775967") {
          return "fd60bc92d9255aa27f356c3381ad84c6f29220a8";
        }
        if (r._id == "c1525afb6f39d76a094d8875c043cf6b00e4fb7d") {
          return "bd2f73aa965f1b49da800656cd37abfade9898db";
        }
        if (r._id == "f22f619c1911c38a89c01df97fe2bf881b8edab3") {
          return "073ac406ef75dc83d577add7e87488ff40b45848";
        }
        return d._id;
      })
    }
  });

  const snapshotProjectContents = chainProjectContents.map(rc => {
    const project = chainProjects.find(r => r._id == rc.projectId);
    return {
      "_id": rc._id,
      "projectId": project._id,
      "description": rc.description,
      "content": rc.content,
      "type": PROJECT_CONTENT_TYPES[rc.content_type.toUpperCase()],
      "authors": rc.authors.filter(author => !blackListUsers.some(name => name == author)),
      "references": rc.references
    }
  });

  const snapshotProjectContentReviews = chainProjectContentsReviews.filter(r => !blackListUsers.some(name => name == r.author) && !genesisJSON.projectContentsReviews.some(review => review._id == r._id)).map(review => {
    return {
      "_id": review._id,
      "projectContentId": review.projectContentId,
      "content": review.content,
      "author": review.author,
      "domains": review.domains.map(d => d._id),
      "scores": review.scores
    }
  });

  const expirationTime = new Date().getTime() + 86400000 * 365 * 3; // 3 years
  
  const snapshotProposals = chainProposalsStates.filter((p) => p.status == 1 || p.status == 5).map((p) => {
    return {
      _id: p._id,
      proposer: p.proposer,
      review_period_seconds: p.review_period_seconds ? p.review_period_seconds : undefined,
      expiration_time: expirationTime,
      active_approvals: p.active_approvals,
      owner_approvals: p.owner_approvals,
      key_approvals: p.key_approvals,
      serialized_proposed_transaction: p.serialized_proposed_transaction
    }
  });

  const outdatedProposals = chainProposalsStates.filter((p) => p.status != 1 && p.status != 5).map((p) => p._id);

  let initSupply = 0;
  const snapshotAccountBallances = [].concat.apply([], chainAssetsBallances.map((chainAssetBallances) => {
    const balances = chainAssetBallances.map((chainAssetBallance) => {
      const isCoreAsset = symbol == 'DEIP' || symbol == 'TESTS';
      return {
        "owner": chainAssetBallance.account,
        "amount": chainAssetBallance.amount,
        "symbol": isCoreAsset ? undefined : chainAssetBallance.symbol,
        "tokenizedProject": chainAssetBallance.tokenizedProject || undefined
      };
    });

    return balances;
  }));
  snapshotAccountBallances.sort((a, b) => (a.owner > b.owner) ? 1 : ((b.owner > a.owner) ? -1 : 0))

  genesisJSON.initSupply = initSupply;
  genesisJSON.accounts.push(...snapshotUsers);
  genesisJSON.domains.push(...snapshotDomains);
  genesisJSON.assets.push(...snapshotAssets);
  genesisJSON.accountBalances.push(...snapshotAccountBallances);
  genesisJSON.teams.push(...snapshotTeams);
  genesisJSON.projects.push(...snapshotProjects);
  genesisJSON.projectContents.push(...snapshotProjectContents);
  genesisJSON.projectContentsReviews.push(...snapshotProjectContentReviews);
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

  const portalSettingsStr = await readFile('./portal.settings.json', 'utf8');
  const portalSettings = JSON.parse(portalSettingsStr);

  const oldPortalDoc = await mongoose.connection.db.collection('portals').findOne({ _id: PORTAL });
  const oldSettings = oldPortalDoc.settings;

  const docs = await Promise.all(collections.map(collection => collection.find({}).toArray()));
  for (let i = 0; i < collectionsNames.length; i++) {
    let collectionName = collectionsNames[i];
    collectionsDocsMap[collectionName].push(...docs[i].map((doc) => {
      if (collectionName == 'portals') {
        if (doc._id == "8c5081e73c0af4c232a78417bc1b573ebe70c40c") {
          return { ...doc, name: "Ariel Scientific Innovations Ltd", shortName: "Ariel Scientific Innovations Ltd", settings: { ...portalSettings, attributes: [...doc.settings.attributes.filter(attr => attr._id != privateAttr._id), networkAccessAttr, privateAttr] }, serverUrl: DEIP_SERVER_URL, network: { ...doc.network, nodes: [], scope: [] } }
        }
        return { ...doc, settings: { ...portalSettings, attributes: [...doc.settings.attributes.filter(attr => attr._id != privateAttr._id), networkAccessAttr, privateAttr ] }, serverUrl: DEIP_SERVER_URL, network: { ...doc.network, nodes: [], scope: [] } }
      }
      else if (collectionName == 'proposals') {
        if (outdatedProposals.some(id => doc._id == id)) {
          return null;
        }
        return { ...doc, portalId: PORTAL, portalIdsScope: [PORTAL] }
      }
      else if (collectionName == 'user-notifications') {
        if (blackListUsers.some(name => doc.username == name)) {
          return null;
        }
        return { ...doc, portalId: PORTAL, portalIdsScope: [PORTAL] }
      }
      else if (collectionName == 'projects') {
        const attributes = doc.attributes;
        const domainsAttrId = "5f62d4fa98f46d2938dde1eb";

        if (!attributes.some(attr => attr.attributeId == privateAttr._id)) {
          attributes.push({
            attributeId: privateAttr._id,
            value: false
          });
        }
        
        if (doc._id == "51e9dbd5851124cdc853f163a67aeb61ee775967") {
          const domainsAttr = attributes.find(attr => attr.attributeId == domainsAttrId);
          domainsAttr.value = ["fd60bc92d9255aa27f356c3381ad84c6f29220a8"]; 
        }

        if (doc._id == "c1525afb6f39d76a094d8875c043cf6b00e4fb7d") {
          const domainsAttr = attributes.find(attr => attr.attributeId == domainsAttrId);
          domainsAttr.value = ["bd2f73aa965f1b49da800656cd37abfade9898db"];
        }

        if (doc._id == "f22f619c1911c38a89c01df97fe2bf881b8edab3") {
          const domainsAttr = attributes.find(attr => attr.attributeId == domainsAttrId);
          domainsAttr.value = ["073ac406ef75dc83d577add7e87488ff40b45848"];
        }

        return { ...doc, attributes: attributes, portalId: PORTAL, status: oldSettings.projectBlacklist.some(id => id == doc._id) ? PROJECT_STATUS.DELETED : doc.status, portalCriterias: undefined, milestones: undefined, partners: undefined }
      }
      else if (collectionName == 'project-contents') {
        return { ...doc, portalId: PORTAL, portalIdsScope: [PORTAL], authors: doc.authors.filter(a => !blackListUsers.some(name => a == name)) }
      }
      else if (collectionName == 'user-profiles') {
        if (blackListUsers.some(name => doc._id == name)) {
          return null;
        }
      }
      else if (collectionName == 'teams') {
        if (blackListUsers.some(name => doc._id == name)) {
          return null;
        }
        if (doc._id == "8c5081e73c0af4c232a78417bc1b573ebe70c40c") {
          return { ...doc, name: "Ariel Scientific Innovations Ltd", portalId: PORTAL };
        }
      }
      else if (collectionName == 'reviews') {
        if (blackListUsers.some(name => doc.author == name)) {
          return null;
        }
        const projectContent = snapshotProjectContents.find(projectContent => projectContent._id == doc.projectContentId)
        return { ...doc, portalId: PORTAL, projectId: projectContent.projectId };
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
        return { ...doc, portalId: PORTAL, expiration: new Date().getTime() + 86400000 * 365 * 3 }
      }
      else if (collectionName == 'user-bookmarks') {
        if (blackListUsers.some(name => doc.username == name)) {
          return null;
        }
      }
      
      return { ...doc, portalId: PORTAL };
      
    }).filter(doc => !!doc));
  }

  await mongoose.disconnect();

  await mongoose.connect(TARGET_DEIP_MONGO_STORAGE_CONNECTION_URL);
  const collections2 = await mongoose.connection.db.collections();
  const collections2Names = collections2.map(collection => collection.collectionName);

  await Promise.all(collections2.map(collection => collection.collectionName == 'portals' ? collection.deleteOne({ _id: PORTAL }) : collection.deleteMany({ portalId: PORTAL })));
  await Promise.all(collectionsNames.filter(collectionName => !collections2Names.some(name => name == collectionName)).map(collectionName => mongoose.connection.db.createCollection(collectionName)));
  await Promise.all(collectionsNames.map(collectionName => collectionsDocsMap[collectionName].length ? mongoose.connection.db.collection(collectionName).insertMany(collectionsDocsMap[collectionName]) : Promise.resolve()));
  await mongoose.disconnect();
};


const q = queue({ concurrency: 1 });

const network = [
  {
    PORTAL: "fa81a9ab079d34b383db5935ce18cafc96f36dc5",
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
    PORTAL: "00067e21d5b12b2393677e87d3fbbc52adcfbb28",
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
    PORTAL: "e7b3aabc542e77062b599d24a00b60ea6122850d",
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
    PORTAL: "8c5081e73c0af4c232a78417bc1b573ebe70c40c",
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
          console.log(`Successfully finished for ${conf.PORTAL}`);
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