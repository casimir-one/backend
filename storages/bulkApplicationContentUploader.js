import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import multer from 'koa-multer';

const storagePath = path.join(__dirname, './../files');
// const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']

const agencyTempStoragePath = (agency, postfix) => `${storagePath}/agencies/${agency}/temp-${postfix}`
const bulkApplicationContentStorage = multer.diskStorage({
    destination: async function(req, file, callback) {
        const agencyTempContentStorage = agencyTempStoragePath(req.headers['agency'], req.headers['upload-session'])
        callback(null, agencyTempContentStorage);
    },
    filename: function(req, file, callback) {
        callback(null, file.originalname);
    }
})

export const bulkApplicationContentUploader = multer({
    storage: bulkApplicationContentStorage,
    fileFilter: function(req, file, callback) {
        // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
        //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
        // }
        callback(null, true);
    }
})