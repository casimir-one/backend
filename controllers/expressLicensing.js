import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import send from 'koa-send';
import slug from 'limax';
import mongoose from 'mongoose';
import deipRpc from '@deip/rpc-client';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import ExpressLicensingService from './../services/expressLicensing';

import * as blockchainService from './../utils/blockchain';
import { APP_EVENTS, RESEARCH_STATUS, ACTIVITY_LOG_TYPE, USER_NOTIFICATION_TYPE, RESEARCH_APPLICATION_STATUS, CHAIN_CONSTANTS, RESEARCH_ATTRIBUTE_TYPE } from './../constants';
import qs from 'qs';


const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


const createExpressLicensingRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {
    
    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const transferDatum = operations.find(([opName]) => opName == 'transfer');
    const approveTransferDatum = operations.find(([opName]) => opName == 'update_proposal');

    const [opName, transferPayload, transferProposal] = transferDatum;
    ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CREATED, { opDatum: transferDatum, context: { emitter: jwtUsername, offchainMeta } }]);

    if (approveTransferDatum) {
      ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_SIGNED, { opDatum: approveTransferDatum, context: { emitter: jwtUsername, offchainMeta } }]);
    }
    
    ctx.status = 200;
    ctx.body = transferProposal;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const approveExpressLicensingRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const approveTransferDatum = operations.find(([opName]) => opName == 'update_proposal');
    const [opName, approveTransferPayload] = approveTransferDatum;

    ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_SIGNED, { opDatum: approveTransferDatum, context: { emitter: jwtUsername, offchainMeta } }]);

    ctx.status = 200;
    ctx.body = approveTransferPayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();

};


const rejectExpressLicensingRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const rejectTransferDatum = operations.find(([opName]) => opName == 'delete_proposal');
    const [opName, rejectTransferPayload] = rejectTransferDatum;

    ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CANCELED, { opDatum: rejectTransferDatum, context: { emitter: jwtUsername, offchainMeta } }]);

    ctx.status = 200;
    ctx.body = rejectTransferPayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};



const getExpressLicensingRequests = async (ctx) => {
  const expressLicensingService = new ExpressLicensingService();

  try {
    const result = await expressLicensingService.getExpressLicensingRequests()
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getExpressLicensingRequestsByStatus = async (ctx) => {
  const expressLicensingService = new ExpressLicensingService();
  const status = ctx.params.status;

  try {
    const result = await expressLicensingService.getExpressLicensingRequestsByStatus(status);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getExpressLicensingRequestById = async (ctx) => {
  const expressLicensingService = new ExpressLicensingService();
  const requestId = ctx.params.requestId;

  try {
    const result = await expressLicensingService.getExpressLicensingRequestById(requestId);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getExpressLicensingRequestsByResearch = async (ctx) => {
  const expressLicensingService = new ExpressLicensingService();
  const researchExternalId = ctx.params.researchExternalId;

  try {
    const result = await expressLicensingService.getExpressLicensingRequestsByResearch(researchExternalId);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getExpressLicensingRequestsByRequester = async (ctx) => {
  const expressLicensingService = new ExpressLicensingService();
  const requester = ctx.params.requester;

  try {
    const result = await expressLicensingService.getExpressLicensingRequestsByRequester(requester);
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}











export default {
  createExpressLicensingRequest,
  approveExpressLicensingRequest,
  rejectExpressLicensingRequest,

  getExpressLicensingRequests,
  getExpressLicensingRequestById,
  getExpressLicensingRequestsByStatus,
  getExpressLicensingRequestsByResearch,
  getExpressLicensingRequestsByRequester
}