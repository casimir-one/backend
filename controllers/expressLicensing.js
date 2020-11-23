import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import qs from 'qs';
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
import ResearchExpressLicenseProposedEvent from './../events/researchExpressLicenseProposedEvent';
import ResearchExpressLicenseProposalSignedEvent from './../events/researchExpressLicenseProposalSignedEvent';


const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


const createExpressLicenseRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {
    
    const txInfo = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const researchExpressLicenseProposedEvent = new ResearchExpressLicenseProposedEvent(datums, offchainMeta);
    ctx.state.events.push(researchExpressLicenseProposedEvent);

    const researchExpressLicensApprovals = researchExpressLicenseProposedEvent.getProposalApprovals();
    for (let i = 0; i < researchExpressLicensApprovals.length; i++) {
      const approval = researchExpressLicensApprovals[i];
      const researchExpressLicenseProposalSignedEvent = new ResearchExpressLicenseProposalSignedEvent([approval]);
      ctx.state.events.push(researchExpressLicenseProposalSignedEvent);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


export default {
  createExpressLicenseRequest
}