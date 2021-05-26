import BaseController from '../base/BaseController';
import {DomainDtoService} from '../../services';

const domainDtoService = new DomainDtoService();

class DomainsController extends BaseController {
  getDomains = this.query({
    h: async (ctx) => {
      try {
        const domains = await domainDtoService.getDomains();
        ctx.status = 200
        ctx.body = domains;
    
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
  getDomainsByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const domains = await domainDtoService.getDomainsByProject(projectId);
        ctx.status = 200;
        ctx.body = domains;
    
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
}

const domainsCtrl = new DomainsController();

module.exports = domainsCtrl;