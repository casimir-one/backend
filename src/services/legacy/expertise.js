import config from './../../config';
import { ChainService } from '@deip/chain-service';

class ExpertiseService {
  async getEciHistoryByResearchContentAndDiscipline(contentId, disciplineId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionByProjectContentAndDisciplineAsync(contentId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionsByResearch(researchId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionsByProjectAsync(researchId);
    return expertise;
  }

  async getExpertiseContributionsByResearchAndDiscipline(researchId, disciplineId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionsByProjectAndDisciplineAsync(researchId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionByResearchContentAndDiscipline(contentId, disciplineId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionByProjectContentAndDisciplineAsync(contentId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionsByResearchContent(contentId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const expertise = await chainRpc.getExpertiseContributionsByProjectContentAsync(contentId);
    return expertise;
  }
}

export default ExpertiseService;