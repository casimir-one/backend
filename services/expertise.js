import deipRpc from '@deip/rpc-client';

class ExpertiseService {
  async getEciHistoryByResearchContentAndDiscipline(contentId, disciplineId) {
    const expertise = await deipRpc.api.getEciHistoryByResearchContentAndDisciplineAsync(contentId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionsByResearch(researchId) {
    const expertise = await deipRpc.api.getExpertiseContributionsByResearchAsync(researchId);
    return expertise;
  }

  async getExpertiseContributionsByResearchAndDiscipline(researchId, disciplineId) {
    const expertise = await deipRpc.api.getExpertiseContributionsByResearchAndDisciplineAsync(researchId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionByResearchContentAndDiscipline(contentId, disciplineId) {
    const expertise = await deipRpc.api.getExpertiseContributionByResearchContentAndDisciplineAsync(contentId, disciplineId);
    return expertise;
  }

  async getExpertiseContributionsByResearchContent(contentId) {
    const expertise = await deipRpc.api.getExpertiseContributionsByResearchContentAsync(contentId);
    return expertise;
  }
}

export default ExpertiseService;