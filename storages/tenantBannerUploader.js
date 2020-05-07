import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import tenantService from './../services/tenant';
import config from './../config';
import multer from 'koa-multer';

const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
const tenantStoragePath = (tenantId) => `${filesStoragePath}/tenants/${tenantId}`;

const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
const tenantStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    const dest = tenantStoragePath(`${req.headers['tenant-id']}`)
    callback(null, dest)
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
})

export const tenantBannerUploader = multer({
  storage: tenantStorage,
  fileFilter: function (req, file, callback) {
    if (allowedMimeTypes.find(mime => mime === file.mimetype) === undefined) {
      return callback(new Error('Only the following mime types are allowed: ' + allowedMimeTypes.join(', ')), false);
    }
    callback(null, true);
  }
})
