import deipRpc from '@deip/rpc-client';
import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import * as authService from './../services/auth';
import * as blockchainService from './../utils/blockchain';
import ResearchGroupService from './../services/researchGroup';
import activityLogEntriesService from './../services/activityLogEntry';
import researchGroupActivityLogHandler from './../event-handlers/researchGroupActivityLog';
import userNotificationHandler from './../event-handlers/userNotification';
import { USER_NOTIFICATION_TYPE, ACTIVITY_LOG_TYPE, APP_EVENTS } from './../constants';
import { researchGroupLogoForm } from './../forms/researchGroupForms';


const createResearchGroup = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;
  const researchGroupsService = new ResearchGroupService();

  try {
    const operation = tx['operations'][0];
    const payload = operation[1];

    const { new_account_name: researchGroupExternalId, creator } = payload;
    const txResult = await blockchainService.sendTransactionAsync(tx);

    const researchGroupRef = await researchGroupsService.createResearchGroupRef({ 
      externalId: researchGroupExternalId, 
      creator
    });

    const researchGroup = await researchGroupsService.getResearchGroup(researchGroupExternalId);

    ctx.status = 200;
    ctx.body = researchGroup;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const updateResearchGroup = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta, isProposal } = ctx.request.body;

  try {

    const operation = isProposal ? tx['operations'][0][1]['proposed_ops'][0]['op'] : tx['operations'][0];
    const payload = operation[1];

    const {
      account: researchGroupAccount
    } = payload;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupAccount, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 400;
      ctx.body = `"${jwtUsername}" is not a member of "${researchGroupAccount}" group`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);

    ctx.status = 200;
    ctx.body = { txResult };

    ctx.state.events.push([isProposal ? APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED : APP_EVENTS.RESEARCH_GROUP_UPDATED, { tx, emitter: jwtUsername }]);

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const excludeFromResearchGroup = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta, isProposal} = ctx.request.body;

  try {

    const operation = isProposal ? tx['operations'][0][1]['proposed_ops'][0]['op'] : tx['operations'][0];
    const payload = operation[1];

    const {
      research_group: researchGroupAccount,
      member
    } = payload;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupAccount, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 400;
      ctx.body = `"${jwtUsername}" is not a member of "${researchGroupAccount}" group`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);

    const researchGroupInternalId = authorizedGroup.id;

    // LEGACY >>>
    const parsedProposal = {
      research_group_id: researchGroupInternalId,
      action: deipRpc.operations.getOperationTag("leave_research_group_membership"),
      creator: jwtUsername,
      data: { name: member },
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


const getResearchGroupActivityLogs = async (ctx) => {
  let jwtUsername = ctx.state.user.username;
  let researchGroupExternalId = ctx.params.researchGroupExternalId;
  // todo: add access validation
  try {

    const researchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
    const researchGroupId = researchGroup.id;

    let result = await activityLogEntriesService.findActivityLogsEntriesByResearchGroup(researchGroupId)
    ctx.status = 201;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
const researchGroupStoragePath = (researchGroupExternalId) => `${filesStoragePath}/research-groups/${researchGroupExternalId}`;
const researchGroupLogoImagePath = (researchGroupExternalId, ext = 'png') => `${researchGroupStoragePath(researchGroupExternalId)}/logo.${ext}`;
const defaultResearchGroupLogoPath = () => path.join(__dirname, `./../default/default-research-group-logo.png`);


const uploadResearchGroupLogo = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchGroupExternalId = ctx.request.headers['research-group-external-id'];
  
  const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupExternalId, jwtUsername);
  if (!authorizedGroup) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not permitted to edit "${researchGroupExternalId}" research`;
    return;
  }

  const stat = util.promisify(fs.stat);
  const unlink = util.promisify(fs.unlink);
  const ensureDir = util.promisify(fsExtra.ensureDir);

  try {
    const filepath = researchGroupLogoImagePath(researchGroupExternalId);

    await stat(filepath);
    await unlink(filepath);
  } catch (err) {
    await ensureDir(researchGroupStoragePath(researchGroupExternalId))
  }

  const logoImage = researchGroupLogoForm.single('research-background');
  const result = await logoImage(ctx, () => new Promise((resolve, reject) => {
    resolve({ 'filename': ctx.req.file.filename });
  }));

  ctx.status = 200;
  ctx.body = result;
}

const getResearchGroupLogo = async (ctx) => {
  const researchGroupExternalId = ctx.params.researchGroupExternalId;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;


  let src = researchGroupLogoImagePath(researchGroupExternalId);
  const stat = util.promisify(fs.stat);

  try {
    const check = await stat(src);
  } catch (err) {
    src = defaultResearchGroupLogoPath();
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

  let logo = await resize(width, height);

  if (isRound) {
    let round = (w) => {
      let r = w / 2;
      let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
      return new Promise((resolve, reject) => {
        logo = sharp(logo)
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

    logo = await round(width);
  }

  ctx.type = 'image/png';
  ctx.body = logo;
}

const getResearchGroup = async (ctx) => {
  let researchGroupExternalId = ctx.params.researchGroupExternalId;
  const researchGroupsService = new ResearchGroupService();

  try {

    const researchGroup = await researchGroupsService.getResearchGroup(researchGroupExternalId);
    ctx.status = 200;
    ctx.body = researchGroup;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


export default {
  getResearchGroup,
  createResearchGroup,
  updateResearchGroup,
  getResearchGroupActivityLogs,
  getResearchGroupLogo,
  uploadResearchGroupLogo,
  excludeFromResearchGroup
}