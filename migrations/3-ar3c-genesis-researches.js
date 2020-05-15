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
const Research = require('./../schemas/research');
const deipRpc = require('@deip/rpc-client');


deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);
mongoose.connect(config.mongo['deip-server'].connection);


const disciplines = [
  {
    "id": 0,
    "name": "Common",
    "parent_id": 0
  },
  {
    "id": 1,
    "name": "Bio Products",
    "parent_id": 0
  },
  {
    "id": 2,
    "name": "Bio Energy",
    "parent_id": 0
  },
  {
    "id": 3,
    "name": "Bio Food",
    "parent_id": 0
  },
  {
    "id": 4,
    "name": "Bio Chemical",
    "parent_id": 0
  },
  {
    "id": 5,
    "name": "Bio Fiber",
    "parent_id": 0
  },
  {
    "id": 6,
    "name": "Bio Mechanical",
    "parent_id": 0
  }
];


const newDisciplines = [
  {
    "name": "Common",
    "external_id": "6c4bb3bcf1a88e3b51de88576d592f1f980c5bbb",
    "external_parent_id": ""
  },
  {
    "name": "Bio Products",
    "external_id": "56dba1440c40847fb1fedbee3cfef524081ee313",
    "external_parent_id": ""
  },
  {
    "name": "Bio Energy",
    "external_id": "1f5dc208490c6f4a8ec86b9dc12c4c1a9a8c420a",
    "external_parent_id": ""
  },
  {
    "name": "Bio Food",
    "external_id": "f3d0968f8d47ffbca23352abcb90aadb345a55d1",
    "external_parent_id": ""
  },
  {
    "name": "Bio Chemical",
    "external_id": "b8ea1adb762f41fe10f193c58bca836b94fb0021",
    "external_parent_id": ""
  },
  {
    "name": "Bio Fiber",
    "external_id": "c4545e9398409ec03c6c2eae25c685ad323f2e60",
    "external_parent_id": ""
  },
  {
    "name": "Bio Mechanical",
    "external_id": "369a26e132a69db02a613a59fc33127f6652dd1d",
    "external_parent_id": ""
  }
];



const run = async () => {

  const researches = await Research.find({});
  const chainResearches = await deipRpc.api.getResearchesAsync(researches.map(r => r._id.toString()));
  let promises = [];
  let genesisResearches = [];

  for (let i = 0; i < researches.length; i++) {
    let research = researches[i];
    let chainResearch = chainResearches.find(r => r.external_id == research._id.toString());

    let genesisResearch = {
      external_id: chainResearch.external_id,
      account: chainResearch.research_group.external_id,
      title: chainResearch.title,
      abstract: chainResearch.abstract,
      is_finished: false,
      is_private: false,
      disciplines: newDisciplines.filter(d => chainResearch.disciplines.some(discipline => d.name == discipline.name)).map(d => d.external_id) 
    }

    genesisResearches.push(genesisResearch);
  }

  console.log(JSON.stringify(genesisResearches));

  return Promise.all(promises);

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