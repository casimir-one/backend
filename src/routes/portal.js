import koa_router from 'koa-router'
import compose from 'koa-compose'
import auth from '../controllers/legacy/auth'
import { usersCtrl, portalCtrl } from '../controllers';

const protected_route = koa_router();
const public_route = koa_router();

async function portalRoute(ctx, next) {
  ctx.state.isPortalRoute = true;
  await next();
}

public_route.get('/', portalRoute, portalCtrl.getPortal);
public_route.get('/banner', portalRoute, portalCtrl.getPortalImgs);
public_route.get('/logo', portalRoute, portalCtrl.getPortalImgs);
public_route.post('/sign-in', portalRoute, auth.signIn);
public_route.get('/settings/attribute-mappings', portalCtrl.getPortalAttributeMappings);
public_route.get('/settings/layout-mappings', portalCtrl.getPortalLayoutMappings);
public_route.get('/settings/custom-fields', portalCtrl.getPortalCustomFields);


async function portalAdminGuard(ctx, next) {
  ctx.assert(ctx.state.isPortalAdmin, 401);
  await next();
}

protected_route.put('/', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortal);
protected_route.put('/settings/attribute-mappings', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalAttributeMappings);
protected_route.put('/settings/layout-mappings', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalLayoutMappings);
protected_route.put('/settings/custom-fields', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalCustomFields);

const routes = { 
  protected: koa_router().use('/portal', protected_route.routes()),
  public: koa_router().use('/portal', public_route.routes())
}

module.exports = routes;