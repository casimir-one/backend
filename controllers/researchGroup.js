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

  const background = await resize(width, height);
  ctx.type = 'image/png';
  ctx.body = background;
}

export default {
  getLogo,
  uploadLogo
}