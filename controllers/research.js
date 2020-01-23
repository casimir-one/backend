import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import deipRpc from '@deip/deip-oa-rpc-client';
import { authorizeResearchGroup } from './../services/auth';

const filesStoragePath = path.join(__dirname, `./../${config.fileStorageDir}`);
const researchStoragePath = (researchId) => `${filesStoragePath}/${researchId}`;
const backgroundImagePath = (researchId, ext = 'png') => `${researchStoragePath(researchId)}/${researchId}.${ext}`;
const defaultBackgroundImagePath = () => `${filesStoragePath}/default/default_research_background.png`;

const allowedBackgroundMimeTypes = ['image/png'];
const researchStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    const dest = researchStoragePath(`${req.headers['research-id']}`)
    callback(null, dest)
  },
  filename: function (req, file, callback) {
    callback(null, `${req.headers['research-id']}.png`);
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

  const background = await resize(width, height);
  ctx.type = 'image/png';
  ctx.body = background;
}

export default {
  getBackground,
  uploadBackground
}