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
import { APP_EVENTS } from './../constants';
import { researchGroupLogoForm } from './../forms/researchGroupForms';
import ResearchGroupCreatedEvent from './../events/researchGroupCreatedEvent';
import ResearchGroupUpdatedEvent from './../events/researchGroupUpdatedEvent';
import ResearchGroupUpdateProposedEvent from './../events/researchGroupUpdateProposedEvent';
import ResearchGroupUpdateProposalSignedEvent from './../events/researchGroupUpdateProposalSignedEvent';


const createResearchGroup = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {
    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const researchGroupCreatedEvent = new ResearchGroupCreatedEvent(datums);
    ctx.state.events.push(researchGroupCreatedEvent);
      
    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const updateResearchGroup = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta, isProposal } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    if (isProposal) {
      const researchGroupUpdateProposedEvent = new ResearchGroupUpdateProposedEvent(datums);
      ctx.state.events.push(researchGroupUpdateProposedEvent);

      const researchGroupUpdateApprovals = researchGroupUpdateProposedEvent.getProposalApprovals();
      for (let i = 0; i < researchGroupUpdateApprovals.length; i++) {
        const approval = researchGroupUpdateApprovals[i];
        const researchGroupUpdateProposalSignedEvent = new ResearchGroupUpdateProposalSignedEvent([approval]);
        ctx.state.events.push(researchGroupUpdateProposalSignedEvent);
      }
      
    } else {
      const researchGroupUpdatedEvent = new ResearchGroupUpdatedEvent(datums);
      ctx.state.events.push(researchGroupUpdatedEvent);
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


const leaveResearchGroup = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const resignationDatum = operations.find(([opName, ...rest]) => opName == 'leave_research_group_membership');
    const [opName, resignationPayload, resignationProposal] = resignationDatum;

    ctx.state.events.push([APP_EVENTS.USER_RESIGNATION_PROPOSED, { opDatum: resignationDatum, context: { emitter: jwtUsername, offchainMeta } }]);

    const approveResignationDatum = operations.find(([opName, opPayload]) => opName == 'update_proposal' && opPayload.external_id == resignationProposal.external_id);
    if (approveResignationDatum) {
      ctx.state.events.push([APP_EVENTS.USER_RESIGNATION_SIGNED, { opDatum: approveResignationDatum, context: { emitter: jwtUsername, resignationPayload, offchainMeta: {} } }]);
    }

    ctx.status = 200;
    ctx.body = resignationPayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
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
  leaveResearchGroup
}