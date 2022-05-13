import Koa from 'koa';
import json from 'koa-json';
import logger from 'koa-logger';
import serve from 'koa-static';
import koa_bodyparser from "koa-bodyparser";
import cors from '@koa/cors';
import config from './config';
import jsonResponse from './response';
import { ChainService } from '@deip/chain-service';
import QueueService from "./queue/QueueService";

if (!config.TENANT) throw new Error(`Portal is not specified`);

const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || '0.0.0.0';

const app = new Koa();

require('./database');
require('./queue');
require('./websocket');
require('./process-manager');

app.use(jsonResponse());
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
app.use(require('./routes/portal.js').public.routes());
app.use(require('./routes/webhook.js').public.routes());


// user auth layer
app.use(require('./middlewares/auth/userAuth.js')());
// portal auth layer
app.use(require('./middlewares/auth/portalAuth.js')());

// protected routes layer
app.use(require('./routes/api.js').protected.routes());
app.use(require('./routes/portal.js').protected.routes());
app.use(require('./routes/webhook').protected.routes());

QueueService.getInstanceAsync(config).then(() => {
  console.log("QueueService started");
}).catch(err => {
  console.log("QueueService error", err.message)
})

ChainService.getInstanceAsync({
  PROTOCOL: config.PROTOCOL,
  DEIP_FULL_NODE_URL: config.DEIP_FULL_NODE_URL,
  CORE_ASSET: config.CORE_ASSET,
  CHAIN_ID: config.CHAIN_ID,
  PORTAL_ID: config.TENANT
})
  .then(() => {
    console.log(config);
    app.listen(PORT, HOST, () => {
      console.log(`Running on http://${HOST}:${PORT}`);
    });
    app.on('error', function (err, ctx) {
      console.log('Server error', err);
    });
  });

module.exports = app;
