import { TeamDtoService, PortalService } from './../../../services';

const portalService = new PortalService();
const teamDtoService = new TeamDtoService();

function teamLogoProxy(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
    const teamId = ctx.params.teamId;

    const team = await teamDtoService.getTeam(teamId);
    ctx.assert(!!team, 404);

    if (team.portalId == currentPortal.id) {
      /* TODO: check access for requested file */
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(team.portalId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = teamLogoProxy;