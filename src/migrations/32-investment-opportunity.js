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
const { ChainService } = require('@deip/chain-service');

const mongoose = require('mongoose');
const InvestmentOpportunitySchema = require('./../schemas/InvestmentOpportunitySchema');
const ProjectSchema = require('./../schemas/ProjectSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  const investmentOppPromises = [];
  const investmentOpps = await InvestmentOpportunitySchema.find({});
  
  for (let i = 0; i < investmentOpps.length; i++) {
    const investmentOpp = investmentOpps[i];
    const investmentOppObj = investmentOpp.toObject();
    const chainInvestmentOp = await chainRpc.getInvestmentOpportunityAsync(investmentOpp._id);
    const project = await ProjectSchema.findOne({ _id: investmentOppObj.projectId });

    const softCap = chainInvestmentOp.softCap;
    const hardCap = chainInvestmentOp.hardCap;
    const totalInvested = chainInvestmentOp.totalInvested;
    const shares = chainInvestmentOp.shares;
    const startTime = investmentOppObj.startTime;
    const endTime = investmentOppObj.endTime;
    
    investmentOpp.teamId = investmentOppObj.teamId || project.teamId;
    investmentOpp.projectId = investmentOppObj.projectId;
    investmentOpp.startTime = startTime;
    investmentOpp.endTime = endTime;
    investmentOpp.shares = investmentOppObj.shares && investmentOppObj.shares.length ? investmentOppObj.shares : shares;
    investmentOpp.softCap = investmentOppObj.softCap || softCap;
    investmentOpp.hardCap = investmentOppObj.hardCap || hardCap;
    investmentOpp.creator = investmentOppObj.creator || 'bob';
    investmentOpp.totalInvested = investmentOppObj.totalInvested || totalInvested;
    investmentOpp.status = investmentOppObj.status;

    investmentOppPromises.push(investmentOpp.save());
  }

  await Promise.all(investmentOppPromises);

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