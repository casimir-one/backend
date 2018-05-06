import Koa from 'koa';
import json from 'koa-json';
import logger from 'koa-logger';
import auth from './routes/auth.js';
import api from './routes/api.js';
import pub from './routes/public.js';
import jwt from 'koa-jwt';
import path from 'path';
import serve from 'koa-static';
import koa_router from "koa-router";
import koa_bodyparser from "koa-bodyparser";
import cors from '@koa/cors';
import config from './config';
import multer from 'koa-multer';

const app = new Koa();
const router = koa_router();

const PORT = 8282;
const HOST = '0.0.0.0';


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

router.use('/auth', auth.routes()); // authentication actions
router.use('/public', pub.routes());
router.use('/api', jwt({ secret: config.jwtSecret }), api.routes())

app.use(router.routes());

app.listen(PORT, HOST, () => {
    console.log(`Running on http://${HOST}:${PORT}`);
});

export default app;