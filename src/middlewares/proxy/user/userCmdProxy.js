import { UserDtoService, PortalService } from './../../../services';

const portalService = new PortalService();
const userDtoService = new UserDtoService();


function userCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const username = ctx.request.header['entity-id'];

    ctx.assert(username === ctx.state.user.username, 403, `You have no permission to edit '${username}' account`);

    const user = await userDtoService.getUser(username);
    if (ctx.req.method === "PUT") {
      ctx.assert(!!user, 404);
    }

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && user.tenantId == currentTenant.id)) {
      await next();
    } else {
      const requestedTenant = await portalService.getPortal(user.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.status = 307;
        ctx.redirect(`${requestedTenant.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = userCmdProxy;