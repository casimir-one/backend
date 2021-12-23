import ProjectDtoService from './ProjectDtoService';
import { DOMAINS } from '../../../constants';
import DomainSchema from '../../../schemas/DomainSchema';
import BaseService from '../../base/BaseService';


class DomainDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(DomainSchema, options);
  }

  mapDomains(domains) {
    return domains.map((domain) => {
      return {
        _id: domain._id,
        portalId: domain.portalId,
        name: domain.name,

        // @deprecated
        // entityId: domain._id,
        // externalId: domain._id,
        parentId: domain.parentId
      }
    });
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
    const project = await projectDtoService.getProject(projectId);
    const domains = await this.findMany({ _id: { $in: [...project.domains] } });
    const result = this.mapDomains(domains);
    return result;
  }
}


export default DomainDtoService;