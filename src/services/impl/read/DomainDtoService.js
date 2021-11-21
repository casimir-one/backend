import ProjectDtoService from './ProjectDtoService';
import { CHAIN_CONSTANTS, DOMAINS } from '../../../constants';
import DomainSchema from '../../../schemas/DomainSchema';
import BaseService from '../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';

class DomainDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(DomainSchema, options);
  }

  mapDomains(domains) {
    return domains.map(d => ({ 
      ...d, 
      entityId: d._id,
      externalId: d._id
    }))
  }

  async getDomains(excluded = DOMAINS.EXCLUDED) {
    const domains = await this.findMany({});
    const filtered = domains.filter(d => !excluded.includes(d._id));
    if (!filtered.length) return [];
    const result = this.mapDomains(filtered);
    return result;
  }

  async getDomainsByProject(projectId) {
    const projectDtoService = new ProjectDtoService();
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const project = await projectDtoService.getProject(projectId);
    const projectDomains = await chainRpc.getDisciplinesByProjectAsync(project.id);
    const domains = await this.findMany({});
    const filtered = domains.filter(d => projectDomains.some(({ external_id }) => d._id === external_id));
    if (!filtered.length) return [];
    const result = this.mapDomains(filtered);
    return result;
  }
 
}

export default DomainDtoService;