import config from './../config'
import TenantService from './../services/legacy/tenant';

const tenantService = new TenantService();

function setup(options) {
  return async function (ctx, next) {
    ctx.state.msg = null;
    ctx.state.appEvents = [];
    ctx.state.proposalsStack = [];
    ctx.state.proposalsStackFrame = null;
    ctx.state.events = []; // legacy

    const tenant = await tenantService.getTenant(config.TENANT);
    ctx.state.tenant = tenant;

    await next();
  };
}

module.exports = setup;