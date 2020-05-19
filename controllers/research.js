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
import { APP_EVENTS, ACTIVITY_LOG_TYPE, USER_NOTIFICATION_TYPE } from './../constants';


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
  const { tx } = ctx.request.body;

  try {

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { creator: researchGroupAccount } = payload;

    const txResult = await blockchainService.sendTransactionAsync(tx);
    ctx.status = 200;
    ctx.body = { tx, txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


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


const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
const researchStoragePath = (researchId) => `${filesStoragePath}/research-projects/${researchId}`;
const backgroundImagePath = (researchId, ext = 'png') => `${researchStoragePath(researchId)}/background.${ext}`;
const defaultBackgroundImagePath = () => path.join(__dirname, `./../default/default-research-background.png`);

const allowedBackgroundMimeTypes = ['image/png'];
const researchStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    const dest = researchStoragePath(`${req.headers['research-external-id']}`)
    callback(null, dest)
  },
  filename: function (req, file, callback) {
    callback(null, `background.png`);
  }
})

const backgroundImageUploader = multer({
  storage: researchStorage,
  fileFilter: function (req, file, callback) {
    if (allowedBackgroundMimeTypes.find(mime => mime === file.mimetype) === undefined) {
      return callback(new Error('Only the following mime types are allowed: ' + allowedBackgroundMimeTypes.join(', ')), false);
    }
    callback(null, true);
  }
})

const uploadResearchBackground = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchExternalId = ctx.request.headers['research-external-id'];
  const research = await deipRpc.api.getResearchAsync(researchExternalId);
  const authorizedGroup = await authService.authorizeResearchGroupAccount(research.research_group.external_id, jwtUsername);

  if (!authorizedGroup) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not permitted to edit "${researchExternalId}" research`;
    return;
  }

  const stat = util.promisify(fs.stat);
  const unlink = util.promisify(fs.unlink);
  const ensureDir = util.promisify(fsExtra.ensureDir);

  try {
    const filepath = backgroundImagePath(researchExternalId);

    await stat(filepath);
    await unlink(filepath);
  } catch (err) { 
    await ensureDir(researchStoragePath(researchExternalId))
  }

  const backgroundImage = backgroundImageUploader.single('research-background');
  const result = await backgroundImage(ctx, () => new Promise((resolve, reject) => {
    resolve({ 'filename': ctx.req.file.filename });
  }));

  ctx.status = 200;
  ctx.body = result;
}

const getResearchBackground = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  let src = backgroundImagePath(researchExternalId);
  const stat = util.promisify(fs.stat);

  try {
    const check = await stat(src);
  } catch (err) {
    src = defaultBackgroundImagePath();
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
  createResearchTokenSale,
  createResearchTokenSaleContribution
}