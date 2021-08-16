import ProjectDtoService from './ProjectDtoService';
import { CHAIN_CONSTANTS } from '../../../constants';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import BaseService from '../../base/BaseService';
import InvestmentOpportunitySchema from '../../../schemas/InvestmentOpportunitySchema';


class InvestmentOpportunityDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(InvestmentOpportunitySchema, options);
  }

  async mapInvestmentOpportunity(investmentOpps) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const chainInvestmentOpps = await Promise.all(investmentOpps.map((investmentOpp) => chainApi.getProjectTokenSaleAsync(investmentOpp._id)));

    return chainInvestmentOpps
      .map((chainInvestmentOp, i) => {
        const investmentOpp = investmentOpps.find((investmentOpp) => investmentOpp._id == chainInvestmentOp.external_id);
        return {
          ...chainInvestmentOp,
          entityId: chainInvestmentOp.external_id,
          type: investmentOpp.type,
          title: investmentOpp.title || "",
          metadata: investmentOpp.metadata || {}
        }
      });
  }


  async getProjectTokenSale(tokenSaleId) {
    const investmentOpp = await this.findOne({ _id: tokenSaleId });
    if (!investmentOpp) return null;
    const results = await this.mapInvestmentOpportunity([investmentOpp]);
    const [result] = results;
    return result;
  }
  
  async getProjectTokenSalesByProject(projectId) {
    const investmentOpps = await this.findMany({ projectId });
    const result = await this.mapInvestmentOpportunity(investmentOpps);
    return result;
  }

  async getProjectTokenSaleContributions(projectTokenSaleExternalId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectTokenSaleContributionsByProjectTokenSaleAsync(projectTokenSaleExternalId);
    return result;
  }

  async getProjectTokenSaleContributionsByProject(projectId) {
    const projectDtoService = new ProjectDtoService();
    const project = await projectDtoService.getProject(projectId);
    if (!project) {
      return [];
    }
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getContributionsHistoryByProjectAsync(project.entityId);
    return result;
  }

  async getAccountRevenueHistoryByAsset(account, symbol, step=0, cursor=0, targetAsset) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const history = await chainApi.getAccountRevenueHistoryBySecurityTokenAsync(account, symbol, cursor, step, targetAsset);
    return history;
  }
  
  async getAccountRevenueHistory(account, cursor=0) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const history = await chainApi.getAccountRevenueHistoryAsync(account, cursor);
    return history;
  }

  async getAccountContributionsHistory(account) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const history = await chainApi.getContributionsHistoryByContributorAsync(account);
    const assets = await chainApi.lookupAssetsAsync(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT);
    const promises = [];
    const res = history.reduce((accum, current) => {
      const currentDataOp = current.op[1];
      for (let i = 0; i < accum.length; i++) {
        if (accum[i].projectId === currentDataOp.research_external_id && accum[i].tokenSale === currentDataOp.research_token_sale_external_id) {
          const [count, asset] = accum[i].amount.split(' ');
          const [currentCount, currentAsset] = currentDataOp.amount.split(' ');
          const assetInfo = assets.find(({ string_symbol }) => string_symbol === asset);
          const amount = (parseFloat(count) + parseFloat(currentCount)).toFixed(assetInfo ? assetInfo.precision : 0)
          accum[i].amount = `${amount} ${asset}`;
          return accum;
        }
      }
      promises.push(this.getProjectTokenSale(currentDataOp.research_token_sale_external_id))
      return [ ...accum, {
        projectId: currentDataOp.research_external_id,
        tokenSale: currentDataOp.research_token_sale_external_id,
        amount: currentDataOp.amount
      }];
    }, []);
    const tokenSalesInfo = await Promise.all(promises);
    return res.map(r => ({
      ...r,
      tokenSale: tokenSalesInfo.find(({ external_id }) => external_id === r.tokenSale)
    }));
  }

  async getContributionsHistoryByTokenSale(tokenSaleId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const history = await chainApi.getContributionsHistoryByTokenSaleAsync(tokenSaleId);
    const res = history.map((h) => ({
      timestamp: h.timestamp,
      contributor: h.op[1].contributor,
      amount: h.op[1].amount
    }))
    return res;
  }

  async getAssetRevenueHistory(symbol, cursor=0) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const history = await chainApi.getSecurityTokenRevenueHistoryAsync(symbol, cursor);
    return history;
  }
  
}


export default InvestmentOpportunityDtoService;