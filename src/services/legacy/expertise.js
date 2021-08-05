import config from './../../config';
import { ChainService } from '@deip/chain-service';

class ExpertiseService {
  async getEciHistoryByResearchContentAndDiscipline(contentId, disciplineId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const expertise = await chainApi.getExpertiseContributionByProjectContentAndDisciplineAsync(contentId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionsByResearch(researchId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const expertise = await chainApi.getExpertiseContributionsByProjectAsync(researchId);
    return expertise;
  }

  async getExpertiseContributionsByResearchAndDiscipline(researchId, disciplineId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const expertise = await chainApi.getExpertiseContributionsByProjectAndDisciplineAsync(researchId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionByResearchContentAndDiscipline(contentId, disciplineId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const expertise = await chainApi.getExpertiseContributionByProjectContentAndDisciplineAsync(contentId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionsByResearchContent(contentId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const expertise = await chainApi.getExpertiseContributionsByProjectContentAsync(contentId);
    return expertise;
  }
}

export default ExpertiseService;