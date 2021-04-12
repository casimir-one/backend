import config from './../../config';

function tenantAuth(options) {
  return async function (ctx, next) {
    const jwtUsername = ctx.state.user.username;
    ctx.state.isTenantAdmin = ctx.state.tenant.admins.some(name => name == jwtUsername);
    await next();
  };
}

module.exports = tenantAuth;