import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import * as blockchainService from './../../utils/blockchain';
import ResearchExpressLicenseProposedEvent from './../../events/legacy/researchExpressLicenseProposedEvent';
import ResearchExpressLicenseProposalSignedEvent from './../../events/legacy/researchExpressLicenseProposalSignedEvent';
import ExpressLicensingService from './../../services/legacy/expressLicensing';

const expressLicensingService = new ExpressLicensingService();

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

const getResearchLicense = async (ctx) => {
  const externalId = ctx.params.externalId;
  try {
    const expertise = await expressLicensingService.getResearchLicense(externalId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchLicensesByLicensee = async (ctx) => {
  const licensee = ctx.params.licensee;
  try {
    const expertise = await expressLicensingService.getResearchLicensesByLicensee(licensee);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchLicensesByLicenser = async (ctx) => {
  const licenser = ctx.params.licenser;
  try {
    const expertise = await expressLicensingService.getResearchLicensesByLicenser(licenser);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchLicensesByResearch = async (ctx) => {
  const researchId = ctx.params.researchId;
  try {
    const expertise = await expressLicensingService.getResearchLicensesByResearch(researchId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchLicensesByLicenseeAndResearch = async (ctx) => {
  const { licensee, researchId } = ctx.params;
  try {
    const expertise = await expressLicensingService.getResearchLicensesByLicenseeAndResearch(licensee, researchId);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchLicensesByLicenseeAndLicenser = async (ctx) => {
  const { licensee, licenser } = ctx.params;
  try {
    const expertise = await expressLicensingService.getResearchLicensesByLicenseeAndLicenser(licensee, licenser);
    if (!expertise) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = expertise;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


export default {
  createExpressLicenseRequest,
  getResearchLicense,
  getResearchLicensesByLicensee,
  getResearchLicensesByLicenser,
  getResearchLicensesByResearch,
  getResearchLicensesByLicenseeAndResearch,
  getResearchLicensesByLicenseeAndLicenser
}