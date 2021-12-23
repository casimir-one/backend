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
public_route.get('/settings/attribute-settings', portalCtrl.getPortalAttributeSettings);
public_route.get('/settings/layout-settings', portalCtrl.getPortalLayoutSettings);
public_route.get('/settings/layouts', portalCtrl.getPortalLayouts);


async function portalAdminGuard(ctx, next) {
  ctx.assert(ctx.state.isPortalAdmin, 401);
  await next();
}

protected_route.put('/profile', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalProfile);
protected_route.put('/settings', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalSettings);
protected_route.put('/network-settings', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalNetworkSettings);
protected_route.put('/settings/attribute-settings', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalAttributeSettings);
protected_route.put('/settings/layout-settings', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalLayoutSettings);
protected_route.put('/settings/layouts', compose([portalRoute, portalAdminGuard]), portalCtrl.updatePortalLayouts);

protected_route.post('/v2/registry/sign-up', compose([portalRoute, portalAdminGuard]), usersCtrl.createUser);
// TODO: replace with specific command handlers
protected_route.put('/v2/registry/sign-ups/approve', compose([portalRoute, portalAdminGuard]), /* portalCtrl.approveSignUpRequest */ usersCtrl.createUser);
protected_route.get('/registry/sign-ups', compose([portalRoute, portalAdminGuard]), portalCtrl.getSignUpRequests);
protected_route.put('/registry/sign-ups/reject', compose([portalRoute, portalAdminGuard]), portalCtrl.rejectSignUpRequest);

const routes = { 
  protected: koa_router().use('/portal', protected_route.routes()),
  public: koa_router().use('/portal', public_route.routes())
}

module.exports = routes;