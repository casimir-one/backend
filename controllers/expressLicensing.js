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
import usersService from './../services/users';
import ProposalService from './../services/proposal';
import * as blockchainService from './../utils/blockchain';
import { APP_EVENTS, RESEARCH_STATUS, ACTIVITY_LOG_TYPE, USER_NOTIFICATION_TYPE, RESEARCH_APPLICATION_STATUS, CHAIN_CONSTANTS, RESEARCH_ATTRIBUTE_TYPE } from './../constants';
import qs from 'qs';


const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


const createExpressLicenseRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {
    
    const txInfo = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const createResearchLicenseDatum = operations.find(([opName]) => opName == 'create_research_license');
    const approveTransferDatum = operations.find(([opName]) => opName == 'update_proposal');

    const [opName, createResearchLicensePayload, createResearchLicenseProposal] = createResearchLicenseDatum;
    ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CREATED, { opDatum: createResearchLicenseDatum, context: { emitter: jwtUsername, offchainMeta: { ...offchainMeta, txInfo: { ...txInfo, timestamp: new Date(Date.now()).toISOString() } } } }]);

    if (approveTransferDatum) {
      ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_SIGNED, { opDatum: approveTransferDatum, context: { emitter: jwtUsername, offchainMeta: { ...offchainMeta, txInfo: { ...txInfo, timestamp: new Date(Date.now()).toISOString() } } } }]);
    }
    
    ctx.status = 200;
    ctx.body = createResearchLicenseProposal;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const approveExpressLicenseRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const txInfo = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const approveTransferDatum = operations.find(([opName]) => opName == 'update_proposal');
    const [opName, approveTransferPayload] = approveTransferDatum;

    ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_SIGNED, { opDatum: approveTransferDatum, context: { emitter: jwtUsername, offchainMeta: { txInfo: { ...txInfo, timestamp: new Date(Date.now()).toISOString() } } } }]);

    ctx.status = 200;
    ctx.body = approveTransferPayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();

};


const rejectExpressLicenseRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const txInfo = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const rejectTransferDatum = operations.find(([opName]) => opName == 'delete_proposal');
    const [opName, rejectTransferPayload] = rejectTransferDatum;

    ctx.state.events.push([APP_EVENTS.RESEARCH_EXPRESS_LICENSE_REQUEST_CANCELED, { opDatum: rejectTransferDatum, context: { emitter: jwtUsername, offchainMeta: { txInfo: { ...txInfo, timestamp: new Date(Date.now()).toISOString() } } } }]);

    ctx.status = 200;
    ctx.body = rejectTransferPayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


export default {
  createExpressLicenseRequest,
  approveExpressLicenseRequest,
  rejectExpressLicenseRequest
}