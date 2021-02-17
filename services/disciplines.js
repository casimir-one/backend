import deipRpc from '@deip/rpc-client';
import ResearchService from './research';
import BaseReadModelService from './base';
import { CHAIN_CONSTANTS, DISCIPLINES } from './../constants';
import Discipline from './../schemas/discipline';

class DisciplinesService extends BaseReadModelService {

  constructor() {
    super(Discipline);
  }

  mapDisciplines(disciplines) {
    return disciplines.map(d => ({ ...d, externalId: d._id }))
  }

  async getDomainDisciplines(disciplinesCount = CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT, excluded = DISCIPLINES.EXCLUDED) {
    // const chainDisciplines = await deipRpc.api.lookupDisciplinesAsync(0, disciplinesCount);
    const disciplines = await this.findMany({});
    const result = this.mapDisciplines(disciplines.filter(d => !excluded.includes(d._id)))
    return result;
  }

  async getDisciplinesByResearch(researchExternalId) {
    const researchService = new ResearchService();
    const disciplines = await this.findMany({});
    const research = await researchService.getResearch(researchExternalId);
    const researchDisciplines = await deipRpc.api.getDisciplinesByResearchAsync(research.id);
    const result = this.mapDisciplines(disciplines.filter(d => researchDisciplines.find(({external_id}) => d._id === external_id)))
    return result;
  }
 
}

export default DisciplinesService;