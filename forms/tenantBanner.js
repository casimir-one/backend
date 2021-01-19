import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import config from './../config';
import multer from 'koa-multer';
import { getFileStorageUploader } from './files';

const TENANT_ID_HEADER = "tenant-id";

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const tenantExternalId = req.headers[TENANT_ID_HEADER];
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
const TeantBannerForm = async (ctx) => {

  const filesUploader = multer({
    storage: getFileStorageUploader(destinationHandler, filenameHandler),
    fileFilter: fileFilterHandler
  });

  const formHandler = filesUploader.any();
  return formHandler(ctx, () => new Promise((resolve, reject) => {
    try {
      resolve({
        filename: ctx.req.files[0].filename
      });
    } catch (err) {
      reject(err);
    }
  }));
}


export default TeantBannerForm;