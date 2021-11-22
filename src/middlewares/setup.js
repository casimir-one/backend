import config from './../config'
import { PortalDtoService } from './../services';

const portalDtoService = new PortalDtoService();

function setup(options) {
  return async function (ctx, next) {
    ctx.state.msg = null;
    ctx.state.appEvents = [];
    ctx.state.updatedProposals = {};
    ctx.state.proposalsStack = [];
    ctx.state.proposalsStackFrame = null;

    const tenant = await portalDtoService.getPortal(config.TENANT);
    ctx.state.tenant = tenant;

    await next();
  };
}

module.exports = setup;