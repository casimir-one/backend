import { AttributeDtoService, PortalService } from './../../../services';

const portalService = new PortalService();
const attributeDtoService = new AttributeDtoService();


function attributeFileProxy(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
    const attributeId = ctx.params.attributeId;

    const attribute = await attributeDtoService.getAttribute(attributeId);
    ctx.assert(!!attribute, 404);

    if (attribute.portalId == currentPortal.id) {
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(attribute.portalId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.status = 307;
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = attributeFileProxy;