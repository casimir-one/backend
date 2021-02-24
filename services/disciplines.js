import deipRpc from '@deip/rpc-client';
import ResearchService from './research';
import BaseReadModelService from './base';
import { CHAIN_CONSTANTS, DISCIPLINES } from './../constants';
import Discipline from './../schemas/discipline';

class DisciplinesService extends BaseReadModelService {

  constructor(options = { scoped: true }) {
    super(Discipline, options);
  }

  mapDisciplines(disciplines) {
    return disciplines.map(d => ({ ...d, externalId: d._id }))
  }

  async getDomainDisciplines(excluded = DISCIPLINES.EXCLUDED) {
    const disciplines = await this.findMany({});
    const filtered = disciplines.filter(d => !excluded.includes(d._id));
    if (!filtered.length) return [];
    const result = this.mapDisciplines(filtered);
    return result;
  }

  async getDisciplinesByResearch(researchExternalId) {
    const researchService = new ResearchService();
    const research = await researchService.getResearch(researchExternalId);
    const researchDisciplines = await deipRpc.api.getDisciplinesByResearchAsync(research.id);
    const disciplines = await this.findMany({});
    const filtered = disciplines.filter(d => researchDisciplines.some(({ external_id }) => d._id === external_id));
    if (!filtered.length) return [];
    const result = this.mapDisciplines(filtered);
    return result;
  }
 
}

export default DisciplinesService;