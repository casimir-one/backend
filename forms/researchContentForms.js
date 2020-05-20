import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import multer from 'koa-multer';
import config from './../config';
import deipRpc from '@deip/rpc-client';

const storagePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
// const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']

const researchFilesTempStoragePath = (researchId, postfix) => `${storagePath}/research-projects/${researchId}/temp-${postfix}`
const researchContentStorage = multer.diskStorage({
    destination: async function(req, file, callback) {
      const researchFilesTempStorage = researchFilesTempStoragePath(req.headers['research-external-id'], req.headers['upload-session'])
      callback(null, researchFilesTempStorage);
    },
    filename: function(req, file, callback) {
        callback(null, file.originalname);
    }
})

export const researchContentForm = multer({
    storage: researchContentStorage,
    fileFilter: function(req, file, callback) {
        // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
        //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
        // }
        callback(null, true);
    }
})