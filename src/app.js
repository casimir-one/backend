import Koa from 'koa';
import json from 'koa-json';
import logger from 'koa-logger';
import serve from 'koa-static';
import koa_bodyparser from "koa-bodyparser";
import cors from '@koa/cors';
import deipRpc from '@deip/rpc-client';
import config from './config';

if (!config.TENANT) throw new Error(`Tenant is not specified`);

const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || '0.0.0.0';

const app = new Koa();
require('./database');

app.use(cors());
app.use(koa_bodyparser());
app.use(json());
app.use(logger());

// error handler layer
app.use(require('./middlewares/errors')());

// base app setup layer
app.use(require('./middlewares/setup.js')());

// public routes layer
app.use(serve('files/static'));
app.use(require('./routes/auth.js').public.routes());
app.use(require('./routes/api.js').public.routes());
app.use(require('./routes/tenant.js').public.routes());


// user auth layer
app.use(require('./middlewares/auth/userAuth.js')());
// tenant auth layer
app.use(require('./middlewares/auth/tenantAuth.js')());

// protected routes layer
app.use(require('./routes/api.js').protected.routes());
app.use(require('./routes/tenant.js').protected.routes());

// event handlers
app.use(require('./middlewares/legacy/events.js')()); // legacy
app.use(require('./middlewares/events')());

app.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});

app.on('error', function (err, ctx) {
  console.log('Server error', err);
});

deipRpc.api.setOptions({ url: process.env.DEIP_FULL_NODE_URL, reconnectTimeout: 3000 });
deipRpc.config.set('chain_id', process.env.CHAIN_ID);

console.log(config);

module.exports = app;