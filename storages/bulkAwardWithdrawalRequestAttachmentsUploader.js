import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import multer from 'koa-multer';
import config from './../config';

const storagePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
// const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']

const researchAwardWithdrawalRequestsFilesStoragePath = (researchId) => `${storagePath}/research-projects/${researchId}/award-withdrawal-requests-attachments`
const researchAwardWithdrawalRequestsFilesTempStoragePath = (researchId, postfix) => `${researchAwardWithdrawalRequestsFilesStoragePath(researchId)}/temp-${postfix}`


const bulkAwardWithdrawalRequestAttachmentsStorage = multer.diskStorage({
  destination: async function (req, file, callback) {
    const researchFilesTempStorage = researchAwardWithdrawalRequestsFilesTempStoragePath(req.headers['research-id'], req.headers['upload-session'])
    callback(null, researchFilesTempStorage);
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
})

export const bulkAwardWithdrawalRequestAttachmentsUploader = multer({
  storage: bulkAwardWithdrawalRequestAttachmentsStorage,
  fileFilter: function (req, file, callback) {
    // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
    //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
    // }
    callback(null, true);
  }
})