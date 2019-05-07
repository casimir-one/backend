import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import multer from 'koa-multer';

const storagePath = path.join(__dirname, './../files');
// const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']

const researchFilesTempStoragePath = (researchId, postfix) => `${storagePath}/${researchId}/temp-${postfix}`
const bulkResearchContentStorage = multer.diskStorage({
    destination: async function(req, file, callback) {
        const researchFilesTempStorage = researchFilesTempStoragePath(req.headers['research-id'], req.headers['upload-session'])
        callback(null, researchFilesTempStorage);
    },
    filename: function(req, file, callback) {
        callback(null, file.originalname);
    }
})

export const bulkResearchContentUploader = multer({
    storage: bulkResearchContentStorage,
    fileFilter: function(req, file, callback) {
        // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
        //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
        // }
        callback(null, true);
    }
})