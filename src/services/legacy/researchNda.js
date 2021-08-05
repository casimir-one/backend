import config from './../../config';
import { ChainService } from '@deip/chain-service';

class ResearchNdaService {

  async getResearchNda(ndaExternalId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaAsync(ndaExternalId);
    return result;
  }
  
  async getResearchNdaListByCreator(creator) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaByCreatorAsync(creator);
    return result;
  }

  async getResearchNdaListByHash(hash) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaByHashAsync(hash);
    return result;
  }

  async getResearchNdaListByResearch(researchExternalId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaByProjectAsync(researchExternalId);
    return result;
  }

}

export default ResearchNdaService;