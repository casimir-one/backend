import ResearchContentService from './../services/researchContent';
import TenantService from './../services/tenant';
import request from 'request';

async function tenantResearchContentAccess(ctx, next) {
  const tenantService = new TenantService();
  const researchContentService = new ResearchContentService();
  const currentTenant = ctx.state.tenant;

  const researchContentExternalId = ctx.params.researchContentExternalId;
  const fileHash = ctx.params.fileHash;

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

module.exports = tenantResearchContentAccess;