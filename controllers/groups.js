import deipRpc from '@deip/deip-oa-rpc-client';
import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import { authorizeResearchGroup } from './../services/auth';
import { sendTransaction, getTransaction } from './../utils/blockchain';
import activityLogEntriesService from './../services/activityLogEntry';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';
import userNotificationHandler from './../event-handlers/userNotification';

const createResearchGroup = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tx = ctx.request.body;
  const operation = tx['operations'][0];
  const payload = operation[1];

  try {

    const result = await sendTransaction(tx);
    if (result.isSuccess) {
      processNewGroupTx(payload, result.txInfo)
      ctx.status = 201;
    } else {
      throw new Error(`Could not proceed the transaction: ${tx}`);
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getResearchGroupActivityLogs = async (ctx) => {
  let jwtUsername = ctx.state.user.username;
  let researchGroupId = ctx.params.researchGroupId;
  // todo: add access validation
  try {
    let result = await activityLogEntriesService.findActivityLogsEntriesByResearchGroup(researchGroupId)
    ctx.status = 201;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const filesStoragePath = path.join(__dirname, `./../${config.fileStorageDir}`);
const researchGroupStoragePath = (researchGroupId) => `${filesStoragePath}/research-groups/${researchGroupId}`;
const researchGroupLogoImagePath = (researchGroupId, ext = 'png') => `${researchGroupStoragePath(researchGroupId)}/logo.${ext}`;
const defaultresearchGroupLogoPath = () => `${filesStoragePath}/default/default_research_group_logo.png`;

const allowedLogoMimeTypes = ['image/png'];
const researchGroupStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    const dest = researchGroupStoragePath(`${req.headers['research-group-id']}`)
    callback(null, dest)
  },
  filename: function (req, file, callback) {
    callback(null, `logo.png`);
  }
})

const researchGroupLogoUploader = multer({
  storage: researchGroupStorage,
  fileFilter: function (req, file, callback) {
    if (allowedLogoMimeTypes.find(mime => mime === file.mimetype) === undefined) {
      return callback(new Error('Only the following mime types are allowed: ' + allowedLogoMimeTypes.join(', ')), false);
    }
    callback(null, true);
  }
})

const uploadLogo = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchGroupId = ctx.request.headers['research-group-id'];
  const authorized = await authorizeResearchGroup(researchGroupId, jwtUsername);

  if (!authorized) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not permitted to edit "${researchGroupId}" research`;
    return;
  }

  const stat = util.promisify(fs.stat);
  const unlink = util.promisify(fs.unlink);
  const ensureDir = util.promisify(fsExtra.ensureDir);

  try {
    const filepath = researchGroupLogoImagePath(researchGroupId);

    await stat(filepath);
    await unlink(filepath);
  } catch (err) {
    await ensureDir(researchGroupStoragePath(researchGroupId))
  }

  const logoImage = researchGroupLogoUploader.single('research-background');
  const result = await logoImage(ctx, () => new Promise((resolve, reject) => {
    resolve({ 'filename': ctx.req.file.filename });
  }));

  ctx.status = 200;
  ctx.body = result;
}

const getLogo = async (ctx) => {
  const researchGroupId = ctx.params.researchGroupId;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  let src = researchGroupLogoImagePath(researchGroupId);
  const stat = util.promisify(fs.stat);

  try {
    const check = await stat(src);
  } catch (err) {
    src = defaultresearchGroupLogoPath();
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

// TODO: move this to chain/app event emmiter to forward specific events to event handlers (subscribers)
async function processNewGroupTx(payload, txInfo) {
  const transaction = await getTransaction(txInfo.id);
  for (let i = 0; i < transaction.operations.length; i++) {
    const op = transaction.operations[i];
    const opName = op[0];
    const opPayload = op[1];
    if (opName === 'create_research_group' && opPayload.permlink === payload.permlink) {
      const researchGroup = await deipRpc.api.getResearchGroupByPermlinkAsync(opPayload.permlink);
      for (let i = 0; i < opPayload.invitees.length; i++) {
        let invitee = opPayload.invitees[i];
        userNotificationHandler.emit(USER_NOTIFICATION_TYPE.INVITATION, { researchGroupId: researchGroup.id, invitee: invitee.account });
      }
      break;
    }
  }
}


export default {
  createResearchGroup,
  getResearchGroupActivityLogs,
  getLogo,
  uploadLogo
}