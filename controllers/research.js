import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import deipRpc from '@deip/deip-oa-rpc-client';
import Research from './../schemas/research'
import { authorizeResearchGroup } from './../services/auth';

const filesStoragePath = path.join(__dirname, `./../${config.fileStorageDir}`);
const researchStoragePath = (researchId) => `${filesStoragePath}/research-projects/${researchId}`;
const backgroundImagePath = (researchId, ext = 'png') => `${researchStoragePath(researchId)}/background.${ext}`;
const defaultBackgroundImagePath = () => path.join(__dirname, `./../default/default-research-background.png`);

const allowedBackgroundMimeTypes = ['image/png'];
const researchStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    const dest = researchStoragePath(`${req.headers['research-id']}`)
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

const uploadBackground = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchId = ctx.request.headers['research-id'];
  const research = await deipRpc.api.getResearchByIdAsync(researchId);
  const authorized = await authorizeResearchGroup(research.research_group_id, jwtUsername);

  if (!authorized) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
    return;
  }

  const stat = util.promisify(fs.stat);
  const unlink = util.promisify(fs.unlink);
  const ensureDir = util.promisify(fsExtra.ensureDir);

  try {
    const filepath = backgroundImagePath(researchId);

    await stat(filepath);
    await unlink(filepath);
  } catch (err) { 
    await ensureDir(researchStoragePath(researchId))
  }

  const backgroundImage = backgroundImageUploader.single('research-background');
  const result = await backgroundImage(ctx, () => new Promise((resolve, reject) => {
    resolve({ 'filename': ctx.req.file.filename });
  }));

  ctx.status = 200;
  ctx.body = result;
}

const getBackground = async (ctx) => {
  const researchId = ctx.params.researchId;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  let src = backgroundImagePath(researchId);
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

const updateResearch = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchId = ctx.params.researchId;

  const research = await deipRpc.api.getResearchByIdAsync(researchId);
  const authorized = await authorizeResearchGroup(research.research_group_id, jwtUsername);

  if (!authorized) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
    return;
  }
  const researchRm = await Research.findOne({
    researchGroupId: research.research_group_id,
    permlink: research.permlink
  });

  if (!researchRm) {
    ctx.status = 400;
    ctx.body = 'Read model not found';
    return;
  }

  try {
    const { milestones, videoSrc, partners, trl } = ctx.request.body;
    researchRm.milestones = milestones || researchRm.milestones;
    researchRm.videoSrc = videoSrc || researchRm.videoSrc;
    researchRm.partners = partners || researchRm.partners;
    researchRm.trl = trl || researchRm.trl;

    ctx.status = 200;
    ctx.body = await researchRm.save();
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const getResearch = async (ctx) => {
  try {
    const researchId = ctx.params.researchId;

    const research = await deipRpc.api.getResearchByIdAsync(researchId);
    ctx.status = 200;
    ctx.body = await Research.findOne({
      researchGroupId: research.research_group_id,
      permlink: research.permlink
    });
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

export default {
  getBackground,
  uploadBackground,
  getResearch,
  updateResearch
}