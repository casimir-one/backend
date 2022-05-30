import koa_router from 'koa-router'
import swaggerCtrl from './../controllers/impl/SwaggerController'

const public_route = koa_router()

public_route.get('/v2/swagger', swaggerCtrl.getSwaggerJSON)

const routes = {
  public: koa_router().use('/swagger', public_route.routes())
}

module.exports = routes;