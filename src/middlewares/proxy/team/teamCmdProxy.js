import { TeamDtoService, PortalService } from './../../../services';

const portalService = new PortalService();
const teamDtoService = new TeamDtoService();


function teamCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentPortal = ctx.state.portal;
    const teamId = ctx.request.header['entity-id'];

    const team = await teamDtoService.getTeam(teamId);
    if (ctx.req.method === "PUT") {
      ctx.assert(!!team, 404);
    }

    if (ctx.req.method === "POST" || (ctx.req.method === "PUT" && team.portalId == currentPortal.id)) {
      await next();
    } else {
      const requestedPortal = await portalService.getPortal(team.portalId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different portal's server */
        ctx.status = 307;
        ctx.redirect(`${requestedPortal.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = teamCmdProxy;