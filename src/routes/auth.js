import auth from '../controllers/legacy/auth.js'
import koa_router from 'koa-router'

const public_route = koa_router()

public_route.post('/sign-in', auth.signIn)
public_route.post('/sign-up', auth.signUp)
public_route.post('/tenant/sign-in', auth.chunkTenantAccessToken)


const routes = {
  public: koa_router().use('/auth', public_route.routes())
}


module.exports = routes;