import config from './../../../config';
import { ChainService } from '@deip/chain-service';

class ProjectNdaDtoService {

  async getProjectNda(ndaId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaAsync(ndaId);
    return result;
  }
  
  async getProjectNdaListByCreator(creator) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaByCreatorAsync(creator);
    return result;
  }

  async getProjectNdaListByHash(hash) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaByHashAsync(hash);
    return result;
  }

  async getProjectNdaListByProject(projectId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const result = await chainApi.getProjectNdaByProjectAsync(projectId);
    return result;
  }

}

export default ProjectNdaDtoService;