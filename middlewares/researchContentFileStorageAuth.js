import ResearchContentService from './../services/researchContent';
import TenantService from './../services/tenant';


async function researchContentFileStorageAuth(ctx, next) {
  const tenantService = new TenantService();
  const researchContentService = new ResearchContentService();
  const currentTenant = ctx.state.tenant;

  const researchContentExternalId = ctx.params.researchContentExternalId;
  const researchContent = await researchContentService.getResearchContentRef(researchContentExternalId);
  ctx.assert(!!researchContent, 404);

  if (researchContent.tenantId == currentTenant._id) {
    await next();
  } else {
    const requestedTenant = await tenantService.getLegacyTenant(researchContent.tenantId);
    if (false) {
      /* TODO: check access for requested file */
      await next();
    } else {
      ctx.redirect(`${requestedTenant.serverUrl}${ctx.request.originalUrl}`);
      return;
    }
  }
}

module.exports = researchContentFileStorageAuth;