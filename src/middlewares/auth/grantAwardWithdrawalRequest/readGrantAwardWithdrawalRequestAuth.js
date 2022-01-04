import GrantService from './../../../services/legacy/grants';
import { PortalService } from './../../../services';


function grantAwardWithdrawalRequestReadAuth(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
    const awardNumber = ctx.params.awardNumber;
    const paymentNumber = ctx.params.paymentNumber;

    const portalService = new PortalService();
    const grantsService = new GrantService();
    
    const withdrawal = await grantsService.findAwardWithdrawalRequest(awardNumber, paymentNumber);

    ctx.assert(!!withdrawal, 404);

    if (withdrawal.portalId == currentPortal.id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(withdrawal.portalId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = grantAwardWithdrawalRequestReadAuth;