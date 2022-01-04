import { ProjectService, ProjectContentDtoService, ContractAgreementDtoService, PortalService } from './../../../services';
import { getPortalAccessToken } from './../../../utils/network';
import { CONTRACT_AGREEMENT_TYPE } from '@deip/constants';

const portalService = new PortalService();
const projectService = new ProjectService();
const projectContentDtoService = new ProjectContentDtoService();
const contractAgreementDtoService = new ContractAgreementDtoService();


function projectContentCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
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

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && projectContent.portalId == currentPortal.id)) {
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(projectContent.portalId);
      const jwtUsername = ctx.state.user.username;
      const projectLicenses = await contractAgreementDtoService.getContractAgreements({ parties: [jwtUsername], type: CONTRACT_AGREEMENT_TYPE.PROJECT_LICENSE });
      const projectLicense = projectLicenses.find(p => p.terms.projectId === projectContent.projectId)
      if (projectLicense) {
        const accessToken = await getPortalAccessToken({
          profile: {
            ...requestedPortal,
            id: requestedPortal._id
          }
        });
        let url = `${requestedPortal.serverUrl}${ctx.request.originalUrl}`.replace(ctx.request.querystring, '');
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
