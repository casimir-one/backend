import UserService from '../../../services/legacy/users';
import TenantService from '../../../services/legacy/tenant';


function userAttributeMetaUpdateAuth(options = {}) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const userService = new UserService();
    const currentTenant = ctx.state.tenant;
    const currentUser = ctx.state.user;

    const username = options.userEntityId
      ? typeof options.userEntityId === 'string' ? ctx.params[options.userEntityId] : options.userEntityId(ctx)
      : ctx.params.username;

    const user = await userService.getUser(username);
    ctx.assert(!!user, 404);

    if (user.profile.tenantId == currentTenant.id && currentUser.username == username) {
      /* TODO: check access for requested file */
      await next();
    } else {
      ctx.assert(false, 403);
    }
  }
}


module.exports = userAttributeMetaUpdateAuth;