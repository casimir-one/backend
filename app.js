import Koa from 'koa';
import json from 'koa-json';
import logger from 'koa-logger';
import jwt from 'koa-jwt';
import serve from 'koa-static';
import koa_bodyparser from "koa-bodyparser";
import cors from '@koa/cors';
import mongoose from 'mongoose';
import deipRpc from '@deip/rpc-client';
import config from './config';

if (!config.TENANT) throw new Error(`Tenant is not specified`);

deipRpc.api.setOptions({ url: process.env.DEIP_FULL_NODE_URL, reconnectTimeout: 3000 });
deipRpc.config.set('chain_id', process.env.CHAIN_ID);


const app = new Koa();

const PORT = process.env.PORT || 80;
const HOST = process.env.HOST || '0.0.0.0';


app.use(cors());
app.use(koa_bodyparser());
app.use(json());
app.use(logger());

app.use(async function(ctx, next) {
    let start = new Date;
    await next();
    let ms = new Date - start;
    console.log('%s %s - %s', ctx.method, ctx.url, ms);
});

app.use(async function (ctx, next) {
  try {
    await next();
  } catch (err) {
    if (401 === err.status) {
      ctx.status = 401;
      ctx.body = {
        success: false,
        token: null,
        info: 'Protected resource, use "Authorization" header to get access'
      };
    } else {
      throw err;
    }
  }
});


app.on('error', function(err, ctx) {
    console.log('server error', err);
});

// base app setup layer
app.use(require('./middlewares/setup.js')());

// tenant layer
app.use(require('./middlewares/tenant.js')());

// public routes layer
app.use(serve('files/static'));
app.use(require('./routes/auth.js').public.routes());
app.use(require('./routes/api.js').public.routes());
app.use(require('./routes/tenant.js').public.routes());


// user auth layer
app.use(jwt({
  secret: config.JWT_SECRET,
  getToken: function (opts) {
    if (opts.request.query && opts.request.query.authorization) {
      return opts.request.query.authorization;
    }
    return null;
  }})
);

// tenant auth layer
app.use(require('./middlewares/tenantAuth.js')());

// protected routes layer
app.use(require('./routes/api.js').protected.routes());
app.use(require('./routes/tenant.js').protected.routes());

app.use(require('./middlewares/events.js')());

mongoose.connect(config.DEIP_MONGO_STORAGE_CONNECTION_URL);
mongoose.connection.on('connected', () => {
  console.log(`Mongoose default connection open to ${config.DEIP_MONGO_STORAGE_CONNECTION_URL}`);
});
mongoose.connection.on('error',  (err) => {
    console.log(`Mongoose default connection error: ${err}`);
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose default connection disconnected');
});

app.listen(PORT, HOST, () => {
    console.log(`Running on http://${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
    mongoose.connection.close( () => {
        console.log('Mongoose default connection closed through app termination');
        process.exit(0);
    });
});

console.log(config)
export default app;