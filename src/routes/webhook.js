
import koa_router from 'koa-router';
import { createAssetDepositRequest, confirmAssetDepositRequest, getDepositRequestByToken } from './../webhooks/deposit';

const public_route = koa_router();
const protected_route = koa_router();

public_route.post('/assets/emit', confirmAssetDepositRequest)
protected_route.post('/assets/deposit', createAssetDepositRequest)
protected_route.get('/assets/deposit/:requestToken', getDepositRequestByToken);

const routes = {
  public: koa_router().use('/webhook', public_route.routes()),
  protected: koa_router().use('/webhook', protected_route.routes())
}

module.exports = routes;
