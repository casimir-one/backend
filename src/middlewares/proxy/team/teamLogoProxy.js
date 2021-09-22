import { TeamDtoService } from './../../../services';
import TenantService from './../../../services/legacy/tenant';

const tenantService = new TenantService();
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
      const requestedTenant = await tenantService.getTenant(team.tenantId);
      if (true) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = teamLogoProxy;