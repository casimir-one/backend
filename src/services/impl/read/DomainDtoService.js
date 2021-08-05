import deipRpc from '@deip/rpc-client';
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
    return domains.map(d => ({ ...d, externalId: d._id }))
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
    const chainApi = chainService.getChainApi();
    const project = await projectDtoService.getResearch(projectId);
    const projectDomains = await chainApi.getDisciplinesByProjectAsync(project.id);
    const domains = await this.findMany({});
    const filtered = domains.filter(d => projectDomains.some(({ external_id }) => d._id === external_id));
    if (!filtered.length) return [];
    const result = this.mapDomains(filtered);
    return result;
  }
 
}

export default DomainDtoService;