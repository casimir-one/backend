import UserService from './../../../services/users';
import TenantService from './../../../services/tenant';


function userAvatarFileReadAuth(options = {}) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const userService = new UserService();
    const currentTenant = ctx.state.tenant;

    const username = options.userEntityId
      ? typeof options.userEntityId === 'string' ? ctx.params[options.userEntityId] : options.userEntityId(ctx)
      : ctx.params.username;

    const user = await userService.getUser(username);
    ctx.assert(!!user, 404);

    if (user.profile.tenantId == currentTenant._id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(user.profile.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = userAvatarFileReadAuth;