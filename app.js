import Koa from 'koa';
import json from 'koa-json';
import logger from 'koa-logger';
import auth from './routes/auth.js';
import api from './routes/api.js';
import tenant from './routes/tenant.js';
import researchContent from './routes/researchContent.js';
import application from './routes/application';
import jwt from 'koa-jwt';
import path from 'path';
import serve from 'koa-static';
import koa_router from "koa-router";
import koa_bodyparser from "koa-bodyparser";
import cors from '@koa/cors';
import config from './config';
import mongoose from 'mongoose';

import deipRpc from '@deip/deip-oa-rpc-client';
deipRpc.api.setOptions({ url: config.blockchain.rpcEndpoint });
deipRpc.config.set('chain_id', config.blockchain.chainId);

const app = new Koa();
const router = koa_router();

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

app.use(async function(ctx, next) {
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

app.use(serve('files/static'));
router.use('/auth', auth.routes()); // authentication actions
router.use('/tenants', tenant.routes());

router.use('/api', jwt({
    secret: config.jwtSecret,
    getToken: function (opts) {
        if (opts.request.query && opts.request.query.authorization) {
            return opts.request.query.authorization;
        }
        return null;
    }
}).unless(function (ctx) {
  return (
    ctx.method === 'GET'
    && /^\/api\/user|research|groups/.test(ctx.path)
  );
}), api.routes());

router.use('/content', jwt({
    secret: config.jwtSecret,
    getToken: function (opts) {
        if (opts.request.query && opts.request.query.authorization) {
            return opts.request.query.authorization;
        }
        return null;
    }
}).unless(function (ctx) {
  return (
    ctx.method === 'GET'
    && /^\/content\/refs\/research\/(?!package)/.test(ctx.path)
  );
}), researchContent.routes());

router.use('/applications', jwt({
    secret: config.jwtSecret,
    getToken: function (opts) {
        if (opts.request.query && opts.request.query.authorization) {
            return opts.request.query.authorization;
        }
        return null;
    }
}), application.routes());

app.use(router.routes());

mongoose.connect(config.mongo['deip-server'].connection);
mongoose.connection.on('connected', () => {
    console.log(`Mongoose default connection open to ${config.mongo['deip-server'].connection}`);
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