import { usersCtrl } from '../controllers';
import authCtrl from '../controllers/auth'
import koa_router from 'koa-router'

const public_route = koa_router()

public_route.post('/v3/sign-in', authCtrl.signIn);
public_route.post('/v3/sign-up', authCtrl.signUp);

public_route.post('/v2/import-dao', usersCtrl.importDAO);
public_route.get('/v2/exist/:usernameOrEmail', usersCtrl.checkIfUserExists);

const routes = {
  public: koa_router().use('/auth', public_route.routes())
}


module.exports = routes;