import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import send from 'koa-send';
import slug from 'limax';
import deipRpc from '@deip/rpc-client';
import qs from 'qs';
import UserTransactionsService from './../services/userTransactions';


const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


const getUserTransactions = async (ctx) => {
  const tenant = ctx.state.tenant;
  const jwtUsername = ctx.state.user.username;
  const userTransactionsService = new UserTransactionsService(tenant);
  const status = ctx.params.status;

  try {

    let result = [];
    if (status == 'pending') {
      result = await userTransactionsService.getPendingTransactions(jwtUsername)
    } else if (status == 'resolved') {
      result = await userTransactionsService.getHistoryTransactions(jwtUsername)
    }

    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


export default {
  getUserTransactions
}