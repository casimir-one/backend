import deipRpc from '@deip/rpc-client';
import ResearchService from './research';
import { CHAIN_CONSTANTS, DISCIPLINES } from './../constants';

class DisciplinesService {

  async getDomainDisciplines(disciplinesCount = CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT, excluded = DISCIPLINES.EXCLUDED) {
    const result = await deipRpc.api.lookupDisciplinesAsync(0, disciplinesCount);
    return result.filter(d => !excluded.includes(d.external_id));
  }

  async getDisciplinesByResearch(researchExternalId) {
    const researchService = new ResearchService();
    const research = await researchService.getResearch(researchExternalId);
    const result = await deipRpc.api.getDisciplinesByResearchAsync(research.id);
    return result;
  }
 
}

export default DisciplinesService;