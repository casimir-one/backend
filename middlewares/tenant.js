import config from './../config'
import TenantService from './../services/tenant';
import deipRpc from '@deip/rpc-client';


function tenant(options) {
  return async function (ctx, next) {
    const tenantService = new TenantService();
    const tenantProfile = await tenantService.findTenantProfile(config.TENANT);
    const [tenantAccount] = await deipRpc.api.getAccountsAsync([config.TENANT]);

    const ownerAuth = tenantAccount.active.account_auths.map(([name, threshold]) => name);
    const activeAuth = tenantAccount.owner.account_auths.map(([name, threshold]) => name);

    const admins = [...ownerAuth, ...activeAuth].reduce((acc, name) => {
      if (!acc.some(n => n == name)) {
        return [...acc, name];
      }
      return [...acc];
    }, [])

    ctx.state.tenant = { ...tenantProfile, id: tenantAccount.name, account: tenantAccount, admins };

    await next();
  };
}


module.exports = tenant;