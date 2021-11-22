import koa_router from 'koa-router'
import compose from 'koa-compose'
import auth from '../controllers/legacy/auth'
import { usersCtrl, portalCtrl } from '../controllers';

const protected_route = koa_router();
const public_route = koa_router();

async function tenantRoute(ctx, next) {
  ctx.state.isTenantRoute = true;
  await next();
}

public_route.get('/', tenantRoute, portalCtrl.getPortal);
public_route.get('/banner', tenantRoute, portalCtrl.getPortalImgs);
public_route.get('/logo', tenantRoute, portalCtrl.getPortalImgs);
public_route.post('/sign-in', tenantRoute, auth.signIn);
public_route.get('/settings/attribute-settings', portalCtrl.getPortalAttributeSettings);
public_route.get('/settings/layout-settings', portalCtrl.getPortalLayoutSettings);
public_route.get('/settings/layouts', portalCtrl.getPortalLayouts);


async function tenantAdminGuard(ctx, next) {
  ctx.assert(ctx.state.isTenantAdmin, 401);
  await next();
}

protected_route.put('/profile', compose([tenantRoute, tenantAdminGuard]), portalCtrl.updatePortalProfile);
protected_route.put('/settings', compose([tenantRoute, tenantAdminGuard]), portalCtrl.updatePortalSettings);
protected_route.put('/network-settings', compose([tenantRoute, tenantAdminGuard]), portalCtrl.updatePortalNetworkSettings);
protected_route.put('/settings/attribute-settings', compose([tenantRoute, tenantAdminGuard]), portalCtrl.updatePortalAttributeSettings);
protected_route.put('/settings/layout-settings', compose([tenantRoute, tenantAdminGuard]), portalCtrl.updatePortalLayoutSettings);
protected_route.put('/settings/layouts', compose([tenantRoute, tenantAdminGuard]), portalCtrl.updatePortalLayouts);

protected_route.post('/v2/registry/sign-up', compose([tenantRoute, tenantAdminGuard]), usersCtrl.createUser);
// TODO: replace with specific command handlers
protected_route.put('/v2/registry/sign-ups/approve', compose([tenantRoute, tenantAdminGuard]), /* portalCtrl.approveSignUpRequest */ usersCtrl.createUser);
protected_route.get('/registry/sign-ups', compose([tenantRoute, tenantAdminGuard]), portalCtrl.getSignUpRequests);
protected_route.put('/registry/sign-ups/reject', compose([tenantRoute, tenantAdminGuard]), portalCtrl.rejectSignUpRequest);

const routes = { 
  protected: koa_router().use('/tenant', protected_route.routes()),
  public: koa_router().use('/tenant', public_route.routes())
}

module.exports = routes;