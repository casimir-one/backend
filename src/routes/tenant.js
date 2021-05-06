import koa_router from 'koa-router'
import compose from 'koa-compose'
import tenant from '../controllers/legacy/tenant'
import auth from '../controllers/legacy/auth'

const protected_route = koa_router();
const public_route = koa_router();

async function tenantRoute(ctx, next) {
  ctx.state.isTenantRoute = true;
  await next();
}

public_route.get('/:tenant', tenantRoute, tenant.getTenant);
public_route.get('/banner/:tenant', tenantRoute, tenant.getTenantBanner);
public_route.get('/logo/:tenant', tenantRoute, tenant.getTenantLogo);
public_route.post('/sign-in', tenantRoute, auth.signIn);


async function tenantAdminGuard(ctx, next) {
  ctx.assert(ctx.state.isTenantAdmin, 401);
  await next();
}

protected_route.put('/profile', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantProfile);
protected_route.put('/settings', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantSettings);
protected_route.put('/network-settings', compose([tenantRoute, tenantAdminGuard]), tenant.updateTenantNetworkSettings);

protected_route.get('/registry/sign-ups', compose([tenantRoute, tenantAdminGuard]), tenant.getSignUpRequests);
protected_route.put('/registry/sign-ups/approve', compose([tenantRoute, tenantAdminGuard]), tenant.approveSignUpRequest);
protected_route.put('/registry/sign-ups/reject', compose([tenantRoute, tenantAdminGuard]), tenant.rejectSignUpRequest);
protected_route.post('/registry/sign-up', compose([tenantRoute, tenantAdminGuard]), auth.signUp);
protected_route.put('/admins/add', compose([tenantRoute, tenantAdminGuard]), tenant.addTenantAdmin);
protected_route.put('/admins/remove', compose([tenantRoute, tenantAdminGuard]), tenant.removeTenantAdmin);

const routes = { 
  protected: koa_router().use('/tenant', protected_route.routes()),
  public: koa_router().use('/tenant', public_route.routes())
}

module.exports = routes;