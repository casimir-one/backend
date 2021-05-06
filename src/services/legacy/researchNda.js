import deipRpc from '@deip/rpc-client';


class ResearchNdaService {

  async getResearchNda(ndaExternalId) {
    const result = await deipRpc.api.getResearchNdaAsync(ndaExternalId);
    return result;
  }
  
  async getResearchNdaListByCreator(creator) {
    const result = await deipRpc.api.getResearchNdaByCreatorAsync(creator);
    return result;
  }

  async getResearchNdaListByHash(hash) {
    const result = await deipRpc.api.getResearchNdaByHashAsync(hash);
    return result;
  }

  async getResearchNdaListByResearch(researchExternalId) {
    const result = await deipRpc.api.getResearchNdaByResearchAsync(researchExternalId);
    return result;
  }

}

export default ResearchNdaService;