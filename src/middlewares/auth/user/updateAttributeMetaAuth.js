import { UserService } from './../../../services';

function userAttributeMetaUpdateAuth(options = {}) {
  return async function (ctx, next) {
    const userService = new UserService();
    const currentPortal = ctx.state.portal;
    const currentUser = ctx.state.user;

    const username = options.userEntityId
      ? typeof options.userEntityId === 'string' ? ctx.params[options.userEntityId] : options.userEntityId(ctx)
      : ctx.params.username;

    const user = await userService.getUser(username);
    ctx.assert(!!user, 404);

    if (user.portalId == currentPortal.id && currentUser.username == username) {
      /* TODO: check access for requested file */
      await next();
    } else {
      ctx.assert(false, 403);
    }
  }
}


module.exports = userAttributeMetaUpdateAuth;