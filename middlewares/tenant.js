import config from './../config'
import tenantsService from './../services/tenant';


function tenant(options) {
  return async function (ctx, next) {
    const tenant = await tenantsService.findTenantProfile(config.TENANT);
    ctx.state.tenant = { ...tenant.toObject(), id: tenant._id };
    if (!ctx.state.user) { // user is not logged in (public route)
      ctx.state.isTenantAdmin = false;
      await next();
    } else {
      const jwtUsername = ctx.state.user.username;
      ctx.state.isTenantAdmin = tenant.admins.some(a => a.name == jwtUsername);
      await next();
    }
  };
}


module.exports = tenant;