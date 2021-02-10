import GrantService from './../../../services/grants';
import TenantService from './../../../services/tenant';


function grantAwardWithdrawalRequestReadAuth(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const awardNumber = ctx.params.awardNumber;
    const paymentNumber = ctx.params.paymentNumber;

    const tenantService = new TenantService();
    const grantsService = new GrantService();
    
    const withdrawal = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);

    ctx.assert(!!withdrawal, 404);

    if (withdrawal.tenantId == currentTenant._id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(withdrawal.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = grantAwardWithdrawalRequestReadAuth;