import ResearchService from './../services/research';
import TenantService from './../services/tenant';
import util from 'util';


async function tenantResearchContentAccess(ctx, next) {
  const researchService = new ResearchService();
  const tenantService = new TenantService();
  const researchExternalId = ctx.params.researchExternalId;

  const research = await researchService.getResearch(researchExternalId);
  ctx.assert(!!research, 404);

  if (research.tenantId == ctx.state.tenant._id) {
    ctx.state.requestedTenant = ctx.state.tenant;
    await next();
  } else {
    const researchTenant = await tenantService.getTenant(research.tenantId);

    const tenantAccount = researchTenant.account;
    const tenantProfile = researchTenant.profile;
    ctx.state.requestedTenant = { ...tenantProfile, id: tenantAccount.name, account: tenantAccount, admins: [] };

    if (false) {
      /* TODO: check access for requested file */
    } else {
      await next();
    }

  }

}

module.exports = tenantResearchContentAccess;