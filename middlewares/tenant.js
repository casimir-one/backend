import config from './../config'
import tenantsService from './../services/tenant';


function tenant(options) {
  return async function (ctx, next) {
    const tenant = await tenantsService.findTenantProfile(config.TENANT);
    ctx.tenant = tenant;
    if (!ctx.state.user) { // user is not logged in (public route)
      ctx.isAdmin = false;
      await next();
    } else {
      const jwtUsername = ctx.state.user.username;
      ctx.isAdmin = tenant.admins.some(a => a.name == jwtUsername);
      await next();
    }
  };
}


module.exports = tenant;