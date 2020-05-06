import koa_router from 'koa-router'
import tenant from '../controllers/tenant'
import auth from '../controllers/auth'

const protected_route = koa_router();
const public_route = koa_router();

public_route.get('/logo', tenant.getTenantLogo);
public_route.get('/profile', tenant.getTenantProfile);
protected_route.get('/sign-ups', tenant.getSignUpRequests);
protected_route.put('/sign-ups/approve', tenant.approveSignUpRequest);
protected_route.put('/sign-ups/reject', tenant.rejectSignUpRequest);
protected_route.post('/sign-up', auth.signUp);


const routes = { 
  protected: koa_router().use('/tenant', protected_route.routes()),
  public: koa_router().use('/tenant', public_route.routes())
}

module.exports = routes;