import deipRpc from '@deip/rpc-client';
import ProjectDtoService from './ProjectDtoService';
import { CHAIN_CONSTANTS } from '../../../constants';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';


class FundraisingDtoService {
  async getProjectTokenSalesByProject(projectId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectTokenSalesByProjectAsync(projectId);
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
    const project = await projectDtoService.getResearch(projectId);
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

  async getProjectTokenSale(tokenSaleId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const tokenSale = await chainApi.getProjectTokenSaleAsync(tokenSaleId);
    return tokenSale;
  }
  
}


export default FundraisingDtoService;