import config from './../../config';
import { ChainService } from '@deip/chain-service';

class ExpertiseService {
  async getEciHistoryByProjectContentAndDomain(contentId, domainId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionByProjectContentAndDomainAsync(contentId, domainId);
    return expertise;
  }

  async getExpertiseContributionsByProject(projectId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionsByProjectAsync(projectId);
    return expertise;
  }

  async getExpertiseContributionsByProjectAndDomain(projectId, domainId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionsByProjectAndDomainAsync(projectId, domainId);
    return expertise;
  }

  async getExpertiseContributionByProjectContentAndDomain(contentId, domainId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionByProjectContentAndDomainAsync(contentId, domainId);
    return expertise;
  }

  async getExpertiseContributionsByProjectContent(contentId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionsByProjectContentAsync(contentId);
    return expertise;
  }
}

export default ExpertiseService;