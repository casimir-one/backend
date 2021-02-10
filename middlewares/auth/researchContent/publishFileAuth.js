import ResearchService from './../../../services/research';
import TenantService from './../../../services/tenant';


function researchContentFilePublishAuth(options = {}) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const researchService = new ResearchService();
    const currentTenant = ctx.state.tenant;

    const researchExternalId = options.researchEnitytId 
      ? typeof options.researchEnitytId === 'string' ? ctx.params[options.researchEnitytId] : options.researchEnitytId(ctx)
      : ctx.params.researchExternalId;

    const research = await researchService.getResearch(researchExternalId);
    ctx.assert(!!research, 404);

    if (research.tenantId == currentTenant._id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(research.tenantId);
      if (false) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.status = 307;
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = researchContentFilePublishAuth;