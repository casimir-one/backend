import { ProjectService, ProjectContentDtoService } from './../../../services';
import TenantService from './../../../services/legacy/tenant';
import ExpressLicensingService from './../../../services/legacy/expressLicensing';
import { getTenantAccessToken } from './../../../utils/network';

const tenantService = new TenantService();
const projectService = new ProjectService();
const projectContentDtoService = new ProjectContentDtoService();
const expressLicensingService = new ExpressLicensingService();


function projectContentCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const projectContentId = ctx.request.header['entity-id'];
    const projectId = ctx.request.header['project-id'];

    if (ctx.req.method === "POST" || ctx.req.method === "PUT") {
      ctx.assert(!!projectId, 404);
      const project = await projectService.getProject(projectId);
      ctx.assert(!!project, 404);
    }

    const projectContent = await projectContentDtoService.getProjectContent(projectContentId);
    if (ctx.req.method === "PUT") {
      ctx.assert(!!projectContent, 404);
    }

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && projectContent.tenantId == currentTenant.id)) {
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(projectContent.tenantId);
      const jwtUsername = ctx.state.user.username;
      const expressLicense = await expressLicensingService.getResearchLicensesByLicenseeAndResearch(jwtUsername, projectContent.researchExternalId)
      if (expressLicense) {
        const accessToken = await getTenantAccessToken(requestedTenant);
        let url = `${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`.replace(ctx.request.querystring, '');
        url += `authorization=${accessToken}`;
        for (const [key, value] of Object.entries(ctx.query)) {
          if (key != 'authorization') {
            url += `&${key}=${value}`
          }
        }
        ctx.redirect(url);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = projectContentCmdProxy;
