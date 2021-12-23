import { DraftService, PortalService } from '../../../services';

const portalService = new PortalService();
const draftService = new DraftService();


function draftCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
    const draftId = ctx.request.header['entity-id'];

    const draft = await draftService.getDraft(draftId);

    ctx.assert(!!draft, 404);

    if (draft.portalId == currentPortal.id) {
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(draft.portalId);
      if (false) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.status = 307;
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = draftCmdProxy;
