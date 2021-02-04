import config from './../config'
import TenantService from './../services/tenant';


function tenant(options) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    // TODO: replace with getTenant() call
    const tenant = await tenantService.getLegacyTenant(config.TENANT);
    ctx.state.tenant = tenant;
    await next();
  };
}


module.exports = tenant;