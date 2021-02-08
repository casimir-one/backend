import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import config from './../config';
import multer from 'koa-multer';
import { getFileStorageUploader } from './files';

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const tenantExternalId = config.TENANT
    const tenantsDirPath = fileStorage.getTenantDirPath(tenantExternalId);

    const exists = await fileStorage.exists(tenantsDirPath);
    if (!exists) {
      await fileStorage.mkdir(tenantsDirPath);
    }
    callback(null, tenantsDirPath)
  };
}


const filenameHandler = () => function () {
  return function (req, file, callback) {
    callback(null, file.originalname);
  }
}


const fileFilterHandler = (req, file, callback) => {
  const allowedAvatarMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedAvatarMimeTypes.some(mime => mime === file.mimetype)) {
    return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
  }
  callback(null, true);
}


// TODO: Move all tenant fields to Tenant form after UI form refactoring
const TenantSettingsForm = async (ctx) => {

  const filesUploader = multer({
    storage: getFileStorageUploader(destinationHandler, filenameHandler),
    fileFilter: fileFilterHandler
  });

  const formHandler = filesUploader.fields([
    { name: 'banner', maxCount: 1 },
    { name: 'logo', maxCount: 1 },
  ]);

  return formHandler(ctx, () => new Promise((resolve, reject) => {

    try {

      const [banner] = ctx.req.files.banner ? ctx.req.files.banner : [null];
      const [logo] = ctx.req.files.logo ? ctx.req.files.logo : [null];

      resolve({
        title: ctx.req.body.title,
        banner: banner ? banner.filename : null,
        logo: logo ? logo.filename : null
      });

    } catch (err) {
      reject(err);
    }
  }));
}


export default TenantSettingsForm;