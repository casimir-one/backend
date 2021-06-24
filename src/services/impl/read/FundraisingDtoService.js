import deipRpc from '@deip/rpc-client';
import ProjectDtoService from './ProjectDtoService';


class FundraisingDtoService {
  async getProjectTokenSalesByProject(projectId) {
    const result = await deipRpc.api.getResearchTokenSalesByResearchAsync(projectId);
    return result;
  }

  async getProjectTokenSaleContributions(projectTokenSaleExternalId) {
    const result = await deipRpc.api.getResearchTokenSaleContributionsByResearchTokenSaleAsync(projectTokenSaleExternalId);
    return result;
  }

  async getProjectTokenSaleContributionsByProject(projectId) {
    const projectDtoService = new ProjectDtoService();
    const project = await projectDtoService.getResearch(projectId);
    if (!project) {
      return [];
    }
    const result = await deipRpc.api.getContributionsHistoryByResearchAsync(project.id);
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

  async getProjectTokenSale(tokenSaleId) {
    const tokenSale = await deipRpc.api.getResearchTokenSaleAsync(tokenSaleId);
    return tokenSale;
  }
  
}


export default FundraisingDtoService;