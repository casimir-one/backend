import deipRpc from '@deip/rpc-client';
import ResearchService from './research';
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

  
}


export default FundraisingService;