import config from './../config'
import tenantsService from './../services/tenant';
import deipRpc from '@deip/rpc-client';


function tenant(options) {
  return async function (ctx, next) {
    const tenantProfile = await tenantsService.findTenantProfile(config.TENANT);
    const [tenantAccount] = await deipRpc.api.getAccountsAsync([config.TENANT]);

    let ownerAuth = tenantAccount.active.account_auths.map(([name, threshold]) => name);
    let activeAuth = tenantAccount.owner.account_auths.map(([name, threshold]) => name);
    let postingAuth = tenantAccount.posting.account_auths.map(([name, threshold]) => name);

    const admins = [...ownerAuth, ...activeAuth, ...postingAuth].reduce((acc, name) => {
      if (!acc.some(n => n == name)) {
        return [...acc, name];
      }
      return [...acc];
    }, [])

    ctx.state.tenant = { ...tenantProfile.toObject(), id: tenantAccount.name, account: tenantAccount, admins };

    await next();
  };
}


module.exports = tenant;