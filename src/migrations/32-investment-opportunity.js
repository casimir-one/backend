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
const AssetSchema = require('./../schemas/AssetSchema');

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);

const run = async () => {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const investmentOppPromises = [];
  const investmentOpps = await InvestmentOpportunitySchema.find({});

  const fromStrToObjAsset = async (val) => {
    if (typeof val === 'string') {
      const [amount, symbol] = val.split(' ');
      const asset = await AssetSchema.findOne({ symbol });
      
      return {
        id: asset._id,
        symbol,
        amount: `${Number(amount)}`,
        precision: asset.precision
      }
    }

    if (Array.isArray(val)) {
      const result = [];
      for (let i = 0; i < val.length; i++) {
        const strAsset = val[i];
        const [amount, symbol] = strAsset.split(' ');
        const asset = await AssetSchema.findOne({ symbol });
        result.push({
          id: asset._id,
          symbol,
          amount: `${Number(amount)}`,
          precision: asset.precision
        })
      }
        
      return result;
    }
  }
  
  for (let i = 0; i < investmentOpps.length; i++) {
    const investmentOpp = investmentOpps[i];
    const investmentOppObj = investmentOpp.toObject();
    const chainInvestmentOp = await chainApi.getProjectTokenSaleAsync(investmentOpp._id);
    const project = await ProjectSchema.findOne({ _id: investmentOppObj.projectId })

    const softCap = await fromStrToObjAsset(chainInvestmentOp.soft_cap);
    const hardCap = await fromStrToObjAsset(chainInvestmentOp.hard_cap);
    const totalInvested = await fromStrToObjAsset(chainInvestmentOp.total_amount);
    const shares = await fromStrToObjAsset(chainInvestmentOp.security_tokens_on_sale);
    const startTime = investmentOppObj.startTime ?
      !isNaN(investmentOppObj.startTime) ?
        investmentOppObj.startTime
        : new Date(investmentOppObj.startTime).getTime()
      : new Date(chainInvestmentOp.start_time).getTime();
    const endTime = investmentOppObj.endTime ?
    !isNaN(investmentOppObj.endTime) ?
      investmentOppObj.endTime
      : new Date(investmentOppObj.endTime).getTime()
    : new Date(chainInvestmentOp.end_time).getTime();
    investmentOpp.teamId = investmentOppObj.teamId || project.researchGroupExternalId;
    investmentOpp.projectId = investmentOppObj.projectId || chainInvestmentOp.research_external_id;
    investmentOpp.startTime = startTime;
    investmentOpp.endTime = endTime;
    investmentOpp.shares = investmentOppObj.shares && investmentOppObj.shares.length ? investmentOppObj.shares : shares;
    investmentOpp.softCap = investmentOppObj.softCap || softCap;
    investmentOpp.hardCap = investmentOppObj.hardCap || hardCap;
    investmentOpp.creator = investmentOppObj.creator || 'bob';
    investmentOpp.totalInvested = investmentOppObj.totalInvested || totalInvested;
    investmentOpp.status = investmentOppObj.status || chainInvestmentOp.status;

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