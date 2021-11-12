import { TeamDtoService, PortalService } from './../../../services';

const portalService = new PortalService();
const teamDtoService = new TeamDtoService();

function teamLogoProxy(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const teamId = ctx.params.teamId;

    const team = await teamDtoService.getTeam(teamId);
    ctx.assert(!!team, 404);

    if (team.tenantId == currentTenant.id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedTenant = await portalService.getPortal(team.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.redirect(`${requestedTenant.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = teamLogoProxy;