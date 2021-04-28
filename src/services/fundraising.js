import deipRpc from '@deip/rpc-client';
import ResearchService from './impl/read/ProjectDtoService';
import mongoose from 'mongoose';

class FundraisingService {

  constructor() { };

  async getResearchTokenSalesByResearch(researchExternalId) {
    const result = await deipRpc.api.getResearchTokenSalesByResearchAsync(researchExternalId);
    return result;
  }

  async getResearchTokenSaleContributions(researchTokenSaleExternalId) {
    const result = await deipRpc.api.getResearchTokenSaleContributionsByResearchTokenSaleAsync(researchTokenSaleExternalId);
    return result;
  }

  async getResearchTokenSaleContributionsByResearch(researchExternalId) {
    const researchService = new ResearchService();
    const research = await researchService.getResearch(researchExternalId);
    if (!research) {
      return [];
    }
    const result = await deipRpc.api.getContributionsHistoryByResearchAsync(research.id);
    return result;
  }

  async getAccountRevenueHistoryByAsset(account, symbol, step=0, cursor=0, targetAsset) {
    const history = await deipRpc.api.getAccountRevenueHistoryBySecurityTokenAsync(account, symbol, cursor, step, targetAsset);
    return history;
  }
  
  async getAccountRevenueHistory(account, cursor=0) {
    const history = await deipRpc.api.getAccountRevenueHistoryAsync(account, cursor);
    return history;
  }
  
  async getAssetRevenueHistory(symbol, cursor=0) {
    const history = await deipRpc.api.getSecurityTokenRevenueHistoryAsync(symbol, cursor);
    return history;
  }
  
  async getCurrentTokenSaleByResearch(researchExternalId) {
    const tokenSales = await deipRpc.api.getResearchTokenSalesByResearchAsync(researchExternalId)
    return tokenSales;
  }
  
}


export default FundraisingService;