import config from './../config'
import TenantService from './../services/tenant';


function tenant(options) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const tenant = await tenantService.getTenant(config.TENANT);
    ctx.state.tenant = tenant;
    await next();
  };
}


module.exports = tenant;