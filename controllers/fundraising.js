import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import send from 'koa-send';
import slug from 'limax';
import qs from 'qs';
import deipRpc from '@deip/rpc-client';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import FundraisingService from './../services/fundraising';
import * as blockchainService from './../utils/blockchain';
import ResearchTokenSaleCreatedEvent from './../events/researchTokenSaleCreatedEvent';
import ResearchTokenSaleProposedEvent from './../events/researchTokenSaleProposedEvent';
import ResearchTokenSaleProposalSignedEvent from './../events/researchTokenSaleProposalSignedEvent';
import ResearchTokenSaleContributedEvent from './../events/researchTokenSaleContributedEvent';



const createResearchTokenSale = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, isProposal } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    if (isProposal) {
      const researchTokenSaleProposedEvent = new ResearchTokenSaleProposedEvent(datums);
      ctx.state.events.push(researchTokenSaleProposedEvent);

      const researchTokenSaleApprovals = researchTokenSaleProposedEvent.getProposalApprovals();
      for (let i = 0; i < researchTokenSaleApprovals.length; i++) {
        const approval = researchTokenSaleApprovals[i];
        const researchTokenSaleProposalSignedEvent = new ResearchTokenSaleProposalSignedEvent([approval]);
        ctx.state.events.push(researchTokenSaleProposalSignedEvent);
      }

    } else {
      const researchTokenSaleCreatedEvent = new ResearchTokenSaleCreatedEvent(datums);
      ctx.state.events.push(researchTokenSaleCreatedEvent);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const createResearchTokenSaleContribution = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, isProposal } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const researchTokenSaleContributedEvent = new ResearchTokenSaleContributedEvent(datums);
    ctx.state.events.push(researchTokenSaleContributedEvent);

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const getResearchTokenSalesByResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  try {
    const fundraisingService = new FundraisingService();
    const tokenSales = await fundraisingService.getResearchTokenSalesByResearch(researchExternalId);
    ctx.status = 200;
    ctx.body = tokenSales;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getResearchTokenSaleContributions = async (ctx) => {
  const researchTokenSaleExternalId = ctx.params.researchTokenSaleExternalId;
  try {
    const fundraisingService = new FundraisingService();
    const contributions = await fundraisingService.getResearchTokenSaleContributions(researchTokenSaleExternalId);
    ctx.status = 200;
    ctx.body = contributions;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getResearchTokenSaleContributionsByResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  try {
    const fundraisingService = new FundraisingService();
    const contributions = await fundraisingService.getResearchTokenSaleContributionsByResearch(researchExternalId);
    ctx.status = 200;
    ctx.body = contributions;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};




export default {
  createResearchTokenSale,
  getResearchTokenSalesByResearch,
  createResearchTokenSaleContribution,
  getResearchTokenSaleContributions,
  getResearchTokenSaleContributionsByResearch
}