import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import config from './../config';
import multer from 'koa-multer';

const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
const researchGroupStoragePath = (researchGroupExternalId) => `${filesStoragePath}/research-groups/${researchGroupExternalId}`;

const allowedLogoMimeTypes = ['image/png'];
const researchGroupStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    const dest = researchGroupStoragePath(`${req.headers['research-group-external-id']}`)
    callback(null, dest)
  },
  filename: function (req, file, callback) {
    callback(null, `logo.png`);
  }
})

export const researchGroupLogoUploader = multer({
  storage: researchGroupStorage,
  fileFilter: function (req, file, callback) {
    if (allowedLogoMimeTypes.find(mime => mime === file.mimetype) === undefined) {
      return callback(new Error('Only the following mime types are allowed: ' + allowedLogoMimeTypes.join(', ')), false);
    }
    callback(null, true);
  }
})
