import koa_router from 'koa-router'
import compose from 'koa-compose'
import tenant from '../controllers/legacy/tenant'
import auth from '../controllers/legacy/auth'
import { authCtrl } from '../controllers';

const protected_route = koa_router();
const public_route = koa_router();

async function tenantRoute(ctx, next) {
  ctx.state.isTenantRoute = true;
  await next();
}

public_route.get('/', tenantRoute, tenant.getTenant);
public_route.get('/banner', tenantRoute, tenant.getTenantBanner);
public_route.get('/logo', tenantRoute, tenant.getTenantLogo);
public_route.post('/sign-in', tenantRoute, auth.signIn);
public_route.get('/settings/attribute-settings', tenant.getTenantAttributeSettings);
public_route.get('/settings/layout-settings', tenant.getTenantLayoutSettings);
public_route.get('/settings/layouts', tenant.getTenantLayouts);


async function tenantAdminGuard(ctx, next) {
  ctx.assert(ctx.state.isTenantAdmin, 401);
  await next();
}

protected_route.put('/profile', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantProfile);
protected_route.put('/settings', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantSettings);
protected_route.put('/network-settings', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantNetworkSettings);
protected_route.put('/settings/attribute-settings', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantAttributeSettings);
protected_route.put('/settings/layout-settings', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantLayoutSettings);
protected_route.put('/settings/layouts', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantLayouts);

protected_route.post('/v2/registry/sign-up', compose([tenantRoute, tenantAdminGuard]), authCtrl.signUp);
// TODO: replace with specific command handlers
protected_route.put('/v2/registry/sign-ups/approve', compose([tenantRoute, tenantAdminGuard]), /* tenant.approveSignUpRequest */ authCtrl.signUp);
protected_route.get('/registry/sign-ups', compose([tenantRoute, tenantAdminGuard]), tenant.getSignUpRequests);
protected_route.put('/registry/sign-ups/reject', compose([tenantRoute, tenantAdminGuard]), tenant.rejectSignUpRequest);

const routes = { 
  protected: koa_router().use('/tenant', protected_route.routes()),
  public: koa_router().use('/tenant', public_route.routes())
}

module.exports = routes;