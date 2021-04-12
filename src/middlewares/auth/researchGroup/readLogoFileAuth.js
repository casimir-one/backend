import ResearchGroupService from './../../../services/researchGroup';
import TenantService from './../../../services/tenant';


function researchGroupLogoFileReadAuth(options = {}) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const researchGroupService = new ResearchGroupService();
    const currentTenant = ctx.state.tenant;

    const researchGroupExternalId = options.researchGroupEnitytId
      ? typeof options.researchGroupEnitytId === 'string' ? ctx.params[options.researchGroupEnitytId] : options.researchGroupEnitytId(ctx)
      : ctx.params.researchGroupExternalId;

    const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
    ctx.assert(!!researchGroup, 404);

    if (researchGroup.tenantId == currentTenant.id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(researchGroup.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = researchGroupLogoFileReadAuth;