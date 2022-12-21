import { usersCtrl } from '../controllers';
import authCtrl from '../controllers/auth'
import koa_router from 'koa-router'

const public_route = koa_router()

public_route.post('/v3/sign-in', authCtrl.signIn);
public_route.post('/v3/sign-up', authCtrl.signUp);

const routes = {
  public: koa_router().use('/auth', public_route.routes())
}


module.exports = routes;