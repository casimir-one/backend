import config from './../config'
import deipRpc from '@deip/rpc-client';


function tenantAuth(options) {
  return async function (ctx, next) {
    const jwtUsername = ctx.state.user.username;
    ctx.state.isTenantAdmin = ctx.state.tenant.admins.some(a => a.name == jwtUsername);
    await next();
  };
}

module.exports = tenantAuth;