import { UserService, PortalService } from './../../../services';

function userAvatarFileReadAuth(options = {}) {
  return async function (ctx, next) {
    const portalService = new PortalService();
    const userService = new UserService();
    const currentPortal = ctx.state.portal;

    const username = options.userEntityId
      ? typeof options.userEntityId === 'string' ? ctx.params[options.userEntityId] : options.userEntityId(ctx)
      : ctx.params.username;

    const user = await userService.getUser(username);
    ctx.assert(!!user, 404);

    if (user.portalId == currentPortal.id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(user.portalId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = userAvatarFileReadAuth;