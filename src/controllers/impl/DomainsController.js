import BaseController from '../base/BaseController';
import { DomainDtoService } from '../../services';

const domainDtoService = new DomainDtoService();

class DomainsController extends BaseController {

  getDomains = this.query({
    h: async (ctx) => {
      try {
        const domains = await domainDtoService.getDomains();
        ctx.successRes(domains);
    
      } catch (err) {
        console.error(err);
        ctx.errorRes(err);
      }
    }
  });
  
  getDomainsByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const domains = await domainDtoService.getDomainsByProject(projectId);
        ctx.successRes(domains);
    
      } catch (err) {
        console.error(err);
        ctx.errorRes(err);
      }
    }
  });
}

const domainsCtrl = new DomainsController();

module.exports = domainsCtrl;