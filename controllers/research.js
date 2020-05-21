import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import deipRpc from '@deip/rpc-client';
import researchService from './../services/research';
import * as blockchainService from './../utils/blockchain';
import * as authService from './../services/auth';
import researchGroupActivityLogHandler from './../event-handlers/researchGroupActivityLog';
import userNotificationHandler from './../event-handlers/userNotification';
import { APP_EVENTS, ACTIVITY_LOG_TYPE, USER_NOTIFICATION_TYPE, RESEARCH_APPLICATION_STATUS } from './../constants';
import { researchBackgroundImageFilePath, defaultResearchBackgroundImagePath, researchBackgroundImageForm } from './../forms/researchForms';
import { researchApplicationForm } from './../forms/researchApplicationForms';


const createResearch = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta, isProposal } = ctx.request.body;

  try {

    const operation = isProposal ? tx['operations'][0][1]['proposed_ops'][0]['op'] : tx['operations'][0];
    const payload = operation[1];
    const { external_id: externalId, research_group: researchGroupExternalId } = payload;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupExternalId, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${researchGroupExternalId}" group`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);

    const researchGroupInternalId = authorizedGroup.id;
    const researcRm = await researchService.createResearch({
      externalId,
      researchGroupExternalId,
      researchGroupInternalId,
      ...offchainMeta
    });


    ctx.status = 200;
    ctx.body = { tx, txResult, rm: researcRm };
    ctx.state.events.push([isProposal ? APP_EVENTS.RESEARCH_PROPOSED : APP_EVENTS.RESEARCH_CREATED, { tx, creator: jwtUsername }]);

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const createResearchApplication = async (ctx) => {
  const jwtUsername = ctx.state.user.username;

  try {

    const formUploader = researchApplicationForm.fields([
      { name: 'budgetAttachment', maxCount: 1 },
      { name: 'businessPlanAttachment', maxCount: 1 },
      { name: 'cvAttachment', maxCount: 1 }, 
      { name: 'marketResearchAttachment', maxCount: 1 }
    ]);

    const form = await formUploader(ctx, () => new Promise((resolve, reject) => {
      const [budgetAttachment] = ctx.req.files.budgetAttachment ? ctx.req.files.budgetAttachment : [null];
      const [businessPlanAttachment] = ctx.req.files.businessPlanAttachment ? ctx.req.files.businessPlanAttachment : [null];
      const [cvAttachment] = ctx.req.files.cvAttachment ? ctx.req.files.cvAttachment : [null];
      const [marketResearchAttachment] = ctx.req.files.marketResearchAttachment ? ctx.req.files.marketResearchAttachment : [null];

      resolve({
        budgetAttachment: budgetAttachment ? budgetAttachment.filename : null,
        businessPlanAttachment: businessPlanAttachment ? businessPlanAttachment.filename : null,
        cvAttachment: cvAttachment ? cvAttachment.filename : null, 
        marketResearchAttachment: marketResearchAttachment ? marketResearchAttachment.filename : null, 

        ...ctx.req.body,
        location: JSON.parse(ctx.req.body.location),
        researchDisciplines: JSON.parse(ctx.req.body.researchDisciplines),
        tenantCriterias: JSON.parse(ctx.req.body.tenantCriterias),
        tx: JSON.parse(ctx.req.body.tx)
      });
    }));

    const txResult = await blockchainService.sendTransactionAsync(form.tx);

    const researchApplicationRm = await researchService.createResearchApplication({
      proposalId: form.proposalId,
      researchExternalId: form.researchExternalId,
      researcher: form.researcher,
      title: form.researchTitle,
      abstract: form.researchAbstract,
      disciplines: form.researchDisciplines,
      location: form.location,
      problem: form.problem,
      solution: form.solution,
      tenantCriterias: form.tenantCriterias,
      funding: form.funding,
      eta: new Date(form.eta),
      budgetAttachment: form.budgetAttachment,
      businessPlanAttachment: form.businessPlanAttachment,
      cvAttachment: form.cvAttachment,
      marketResearchAttachment: form.marketResearchAttachment,
      tx: form.tx
    });

    ctx.status = 200;
    ctx.body = { txResult, tx: form.tx, rm: researchApplicationRm };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const approveResearchApplication = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try { 

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: applicationId } = payload;

    const researchApplication = await researchService.findResearchApplicationById(applicationId);
    if (!researchApplication) {
      ctx.status = 404;
      ctx.body = `Research application "${applicationId}" is not found`;
      return;
    }

    if (researchApplication.status != RESEARCH_APPLICATION_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Research application "${applicationId}" status is ${researchApplication.status}`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const research = await deipRpc.api.getResearchAsync(researchApplication.researchExternalId);
    const researcRm = await researchService.createResearch({
      externalId: research.external_id,
      researchGroupExternalId: research.research_group.external_id,
      researchGroupInternalId: research.research_group.id,
      milestones: [],
      videoSrc: "",
      partners: [],
      tenantCriterias: researchApplication.tenantCriterias
    });

    const researchApplicationData = researchApplication.toObject();
    const updatedResearchApplication = await researchService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      status: RESEARCH_APPLICATION_STATUS.APPROVED
    });

    ctx.status = 200;
    ctx.body = { tx, txResult, rm: researcRm };
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchApplications = async (ctx) => {
  const status = ctx.query.status;
  const researcher = ctx.query.researcher;

  try {
    const result = await researchService.getResearchApplications({ status, researcher });
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const createResearchTokenSale = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta, isProposal } = ctx.request.body;

  try {
    const operation = isProposal ? tx['operations'][0][1]['proposed_ops'][0]['op'] : tx['operations'][0];
    const payload = operation[1];
    const researchGroupAccount = payload.research_group;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupAccount, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${researchGroupAccount}" group`;
      return;
    }

    const researchExternalId = payload.research_external_id;
    const research = await deipRpc.api.getResearchAsync(researchExternalId);

    const researchGroupInternalId = authorizedGroup.id;
    const researchInternalId = research.id;

    const txResult = await blockchainService.sendTransactionAsync(tx);

    // LEGACY >>>
    const parsedProposal = {
      research_group_id: researchGroupInternalId,
      action: deipRpc.operations.getOperationTag("create_research_token_sale"),
      creator: jwtUsername,
      data: { research_id: researchInternalId },
      isProposalAutoAccepted: !isProposal
    };
    userNotificationHandler.emit(USER_NOTIFICATION_TYPE.PROPOSAL, parsedProposal);
    researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.PROPOSAL, parsedProposal);
    // <<< LEGACY

    ctx.status = 200;
    ctx.body = { txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const createResearchTokenSaleContribution = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, isProposal } = ctx.request.body;

  try {
    const operation = isProposal ? tx['operations'][0][1]['proposed_ops'][0]['op'] : tx['operations'][0];
    const payload = operation[1];

    const txResult = await blockchainService.sendTransactionAsync(tx);

    ctx.status = 200;
    ctx.body = { txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const uploadResearchBackground = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchExternalId = ctx.request.headers['research-external-id'];

  try {

    const research = await deipRpc.api.getResearchAsync(researchExternalId);
    const authorizedGroup = await authService.authorizeResearchGroupAccount(research.research_group.external_id, jwtUsername);

    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${researchExternalId}" research`;
      return;
    }

    const backgroundImage = researchBackgroundImageForm.single('research-background');
    const result = await backgroundImage(ctx, () => new Promise((resolve, reject) => {
      resolve({ 'filename': ctx.req.file.filename });
    }));

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getResearchBackground = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  let src = researchBackgroundImageFilePath(researchExternalId);
  const stat = util.promisify(fs.stat);

  try {
    const check = await stat(src);
  } catch (err) {
    src = defaultResearchBackgroundImagePath();
  }

  const resize = (w, h) => {
    return new Promise((resolve) => {
      sharp.cache(!noCache);
      sharp(src)
        .rotate()
        .resize(w, h)
        .png()
        .toBuffer()
        .then(data => {
          resolve(data)
        })
        .catch(err => {
          resolve(err)
        });
    })
  }

  let background = await resize(width, height);

  if (isRound) {
    let round = (w) => {
      let r = w / 2;
      let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
      return new Promise((resolve, reject) => {
        background = sharp(background)
          .overlayWith(circleShape, { cutout: true })
          .png()
          .toBuffer()
          .then(data => {
            resolve(data)
          })
          .catch(err => {
            reject(err)
          });
      });
    }

    background = await round(width);
  }

  ctx.type = 'image/png';
  ctx.body = background;
}

const updateResearchMeta = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchExternalId = ctx.params.researchExternalId;
  const update = ctx.request.body;

  try {
    const research = await deipRpc.api.getResearchAsync(researchExternalId);
    const authorizedGroup = await authService.authorizeResearchGroupAccount(research.research_group.external_id, jwtUsername);

    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${researchExternalId}" research`;
      return;
    }

    const researchProfile = await researchService.findResearchById(researchExternalId);
    if (!researchProfile) {
      ctx.status = 400;
      ctx.body = 'Read model not found';
      return;
    }

    const profileData = researchProfile.toObject();
    const updatedProfile = await researchService.updateResearch(researchExternalId, { ...profileData, ...update });

    ctx.status = 200;
    ctx.body = { rm: updatedProfile };
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const updateResearch = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, isProposal } = ctx.request.body;

  try {
    const operation = isProposal ? tx['operations'][0][1]['proposed_ops'][0]['op'] : tx['operations'][0];
    const payload = operation[1];
    const { 
      research_group: researchGroupAccount, 
      external_id: researchExternalId
    } = payload;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupAccount, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${researchGroupAccount}" group`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);

    const researchGroupInternalId = authorizedGroup.id;
    const research = await deipRpc.api.getResearchAsync(researchExternalId);
    const { id: researchInteranlId, permlink } = research;

    // LEGACY >>>
    const parsedProposal = {
      research_group_id: researchGroupInternalId,
      action: deipRpc.operations.getOperationTag("update_research"),
      creator: jwtUsername,
      data: { 
        permlink, 
        research_id: researchInteranlId 
      },
      isProposalAutoAccepted: !isProposal
    };

    userNotificationHandler.emit(USER_NOTIFICATION_TYPE.PROPOSAL, parsedProposal);
    researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.PROPOSAL, parsedProposal);
    // <<< LEGACY

    ctx.status = 201;
    ctx.body = { txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getResearchProfile = async (ctx) => {

  try {
    const researchExternalId = ctx.params.researchExternalId;
    const researcRm = await researchService.findResearchById(researchExternalId);

    ctx.status = 200;
    ctx.body = researcRm;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


export default {
  getResearchBackground,
  uploadResearchBackground,
  getResearchProfile,
  updateResearch,
  updateResearchMeta,
  createResearch,
  createResearchApplication,
  approveResearchApplication,
  getResearchApplications,
  createResearchTokenSale,
  createResearchTokenSaleContribution
}