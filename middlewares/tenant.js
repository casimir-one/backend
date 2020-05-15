import config from './../config'
import tenantsService from './../services/tenant';
import deipRpc from '@deip/rpc-client';


function tenant(options) {
  return async function (ctx, next) {
    const tenantProfile = await tenantsService.findTenantProfile(config.TENANT);
    const tenantAccount = await deipRpc.api.getResearchGroupAsync(config.TENANT);
    
    ctx.state.tenant = { ...tenantProfile.toObject(), id: tenantProfile._id, account: tenantAccount };
    await next();
  };
}


module.exports = tenant;