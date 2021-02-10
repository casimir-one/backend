import ResearchContentService from './../../../services/researchContent';
import TenantService from './../../../services/tenant';


function researchContentFileDeleteAuth(options = {}) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const researchContentService = new ResearchContentService();
    const currentTenant = ctx.state.tenant;

    const researchContentExternalId = options.researchContentEnitytId 
      ? typeof options.researchContentEnitytId === 'string' ? ctx.params[options.researchContentEnitytId] : options.researchContentEnitytId(ctx)
      : ctx.params.researchContentExternalId;

    const researchContent = await researchContentService.getResearchContentRef(researchContentExternalId);
    ctx.assert(!!researchContent, 404);

    if (researchContent.tenantId == currentTenant._id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(researchContent.tenantId);
      if (false) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = researchContentFileDeleteAuth;