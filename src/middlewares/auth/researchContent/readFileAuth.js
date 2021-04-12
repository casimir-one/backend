import ResearchContentService from './../../../services/researchContent';
import TenantService from './../../../services/tenant';
import ExpressLicensingService from './../../../services/expressLicensing';
import { getTenantAccessToken } from './../../../utils/network';


function researchContentFileReadAuth(options = {}) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const researchContentService = new ResearchContentService();
    const expressLicensingService = new ExpressLicensingService();
    const currentTenant = ctx.state.tenant;

    const researchContentExternalId = options.researchContentEnitytId 
      ? typeof options.researchContentEnitytId === 'string' ? ctx.params[options.researchContentEnitytId] : options.researchContentEnitytId(ctx)
      : ctx.params.researchContentExternalId;

    const researchContent = await researchContentService.getResearchContentRef(researchContentExternalId);
    ctx.assert(!!researchContent, 404);

    if (researchContent.tenantId == currentTenant.id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(researchContent.tenantId);
      const jwtUsername = ctx.state.user.username;
      const expressLicense = await expressLicensingService.getResearchLicensesByLicenseeAndResearch(jwtUsername, researchContent.researchExternalId)
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


module.exports = researchContentFileReadAuth;