import { ProjectDtoService, ProjectContentDtoService, DraftService } from '../../../services';
import TenantService from '../../../services/legacy/tenant';

const tenantService = new TenantService();
const projectDtoService = new ProjectDtoService();
const draftService = new DraftService();
const projectContentDtoService = new ProjectContentDtoService();


function draftCmdProxy(options = {}) {
  return async function (ctx, next) {
    const currentTenant = ctx.state.tenant;
    const draftId = ctx.request.header['entity-id'];

    const draft = await draftService.getDraft(draftId);

    ctx.assert(!!draft, 404);

    if (draft.tenantId == currentTenant.id) {
      await next();
    } else {
      const requestedTenant = await tenantService.getTenant(draft.tenantId);
      if (false) { /* TODO: check access for the requested source and chunk an access token to request the different tenant's server */
        ctx.status = 307;
        ctx.redirect(`${requestedTenant.profile.serverUrl}${ctx.request.originalUrl}`);
        return;
      } else {
        ctx.assert(false, 403);
      }
    }
  }
}


module.exports = draftCmdProxy;
