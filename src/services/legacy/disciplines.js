import deipRpc from '@deip/rpc-client';
import ResearchService from './../impl/read/ProjectDtoService';
import BaseService from './../base/BaseService';
import { CHAIN_CONSTANTS, DISCIPLINES } from './../../constants';
import DomainSchema from './../../schemas/write/DomainSchema';

class DisciplinesService extends BaseService {

  constructor(options = { scoped: true }) {
    super(DomainSchema, options);
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