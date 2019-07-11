import Koa from 'koa';
import json from 'koa-json';
import logger from 'koa-logger';
import auth from './routes/auth.js';
import api from './routes/api.js';
import pub from './routes/public.js';
import content from './routes/content.js';
import jwtKoa from 'koa-jwt';
import jwt from 'jsonwebtoken';
import path from 'path';
import serve from 'koa-static';
import koa_router from "koa-router";
import koa_bodyparser from "koa-bodyparser";
import cors from '@koa/cors';
import config from './config';
import mongoose from 'mongoose';
import fs from "fs";

import deipRpc from '@deip/deip-rpc-client';
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

app.use(async function (ctx, next) {
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


app.on('error', function (err, ctx) {
  console.log('server error', err);
});

router.use('/auth', auth.routes()); // authentication actions
router.use('/public', pub.routes());
router.use('/content', jwtKoa({ secret: config.jwtSecret }).unless((req) => {
  return req.method == 'GET';
}), content.routes());
router.use('/api', jwtKoa({ secret: config.jwtSecret }), api.routes());

app.use(router.routes());

mongoose.connect(config.mongo['deip-server'].connection);
mongoose.connection.on('connected', () => {
  console.log(`Mongoose default connection open to ${config.mongo['deip-server'].connection}`);
});
mongoose.connection.on('error', (err) => {
  console.log(`Mongoose default connection error: ${err}`);
});
mongoose.connection.on('disconnected', () => {
  console.log('Mongoose default connection disconnected');
});

// app.listen(PORT, HOST, () => {
//     console.log(`Running on http://${HOST}:${PORT}`);
// });

const server = require('http').createServer(app.callback());
const io = require('socket.io')(server);

io.use(function (socket, next) {
  let token = socket.handshake.query.token;
  if (!token) {
    next(new Error('ws_jwt_missed'));
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      next(new Error('ws_jwt_invalid'));
    } else {
      let user = decoded;
      socket.user = user;
      next();
    }
  })
});

const uploadMap = {};

io.on('connection', (socket) => {

  socket.on('upload_encrypted_chunk', (msg) => {

    if (!uploadMap[msg.uuid]) {
      let ws = fs.createWriteStream(`${msg.uuid}-${msg.filename}`, { 'flags': 'a' });
      uploadMap[msg.uuid] = { ws, isEnded: false };

      ws.on('close', function (err) {
        delete uploadMap[`${msg.uuid}-${msg.filename}`];
        console.log('Writable Stream has been closed');
      });
    }

    if (msg.index != msg.lastIndex) {

      uploadMap[msg.uuid].ws.write(new Buffer(new Uint8Array(msg.data)), (err) => {
        if (err) {
          console.log(err);
        } else {
          socket.emit('uploaded_encrypted_chunk', { filename: msg.filename, uuid: msg.uuid, index: msg.index, lastIndex: msg.lastIndex });
        }
      });
    } else {
      uploadMap[msg.uuid].ws.end(new Buffer(new Uint8Array(msg.data)), (err) => {
        uploadMap[msg.uuid].isEnded = true;
        if (err) {
          console.log(err);
        } else {
          socket.emit('uploaded_encrypted_chunk', { filename: msg.filename, uuid: msg.uuid, index: msg.index, lastIndex: msg.lastIndex });
        }
      })
    }

  }); // listen to the event


  async function readable(rs) {
    return new Promise(r => rs.on('readable', r));
  }

  async function readBytes(rs, num = 2 * 1024 * 1024) {
    let buf = rs.read(num);
    if (buf) {
      return new Promise(r => r(buf));
    }
    else {
      return new Promise(r => {
        readable(rs).then(() => {
          readBytes(rs, num).then(b => r(b));
        });
      });
    }
  }

  const downloadMap = {};
  socket.on('download_encrypted_chunk', async (msg) => {

    if (!downloadMap[msg.uuid]) {
      let stats = fs.statSync(`${msg.uuid}-${msg.filename}`);
      let fileSizeInBytes = stats.size;
      let index = -1;
      let lastIndex = Math.ceil(fileSizeInBytes / (2 * 1024 * 1024)) - 1;

      let rs = fs.createReadStream(`${msg.uuid}-${msg.filename}`, { highWaterMark: 2 * 1024 * 1024 });
      downloadMap[msg.uuid] = { rs, isEnded: false, index, lastIndex };

      rs.on('end', function () {
        downloadMap[msg.uuid].isEnded = true;
      })
        .on('close', function (err) {
          delete downloadMap[`${msg.uuid}-${msg.filename}`];
          console.log('Readable Stream has been closed');
        });
    }

    let data = await readBytes(downloadMap[msg.uuid].rs);
    let lastIndex = downloadMap[msg.uuid].lastIndex;
    let index = ++downloadMap[msg.uuid].index;

    socket.emit('downloaded_encrypted_chunk', { filename: msg.filename, uuid: msg.uuid, data: data, type: msg.type, index, lastIndex });
  });

});


server.listen(PORT, HOST, () => {
  console.log(`Running on http://${HOST}:${PORT}`);
});

process.on('SIGINT', () => {
  mongoose.connection.close(() => {
    console.log('Mongoose default connection closed through app termination');
    process.exit(0);
  });
});

console.log(config)
export default app;