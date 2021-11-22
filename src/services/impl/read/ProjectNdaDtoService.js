import config from './../../../config';
import { ChainService } from '@deip/chain-service';

class ProjectNdaDtoService {

  async getProjectNda(ndaId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    
    const result = await chainRpc.getProjectNdaAsync(ndaId);
    return result;
  }
  
  async getProjectNdaListByCreator(creator) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    
    const result = await chainRpc.getProjectNdaByCreatorAsync(creator);
    return result;
  }

  async getProjectNdaListByHash(hash) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    
    const result = await chainRpc.getProjectNdaByHashAsync(hash);
    return result;
  }

  async getProjectNdaListByProject(projectId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    
    const result = await chainRpc.getProjectNdaByProjectAsync(projectId);
    return result;
  }

}

export default ProjectNdaDtoService;