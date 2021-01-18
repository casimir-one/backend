import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';
import util from 'util';
import multer from 'koa-multer';
import config from './../config';
import deipRpc from '@deip/rpc-client';
import { getFileStorageUploader } from './files';
import { FILE_STORAGE } from './../constants';

const RESEARCH_ID_HEADER = "research-external-id";
const RESEARCH_CONTENT_UPLOAD_SESSION_HEADER = "upload-session";


const destinationHandler = (fileStorage) => function () {

  return async function (req, file, callback) {
    const researchExternalId = req.headers[RESEARCH_ID_HEADER];
    const sessionId = req.headers[RESEARCH_CONTENT_UPLOAD_SESSION_HEADER];
    
    const researchFilesTempStorage = fileStorage.getResearchContentPackageTempDirPath(researchExternalId, sessionId);
    const exists = await fileStorage.exists(researchFilesTempStorage);
    if (!exists) {
      await fileStorage.mkdir(researchFilesTempStorage);
    }

    callback(null, researchFilesTempStorage);
  };
}


const filenameHandler = () => function () {
  return function (req, file, callback) {
    callback(null, file.originalname);
  }
}


const fileFilterHandler = (req, file, callback) => {
  // const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']
  // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
  //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
  // }
  callback(null, true);
}


const ResearchContentForm = async (ctx) => {

  const filesUploader = multer({
    storage: getFileStorageUploader(destinationHandler, filenameHandler),
    fileFilter: fileFilterHandler
  });

  const formHandler = filesUploader.any();
  return formHandler(ctx, () => new Promise((resolve, reject) => {
    try {
      console.log(ctx.req.files);
      resolve({
        tempDestinationPath: ctx.req.files[0].destination
      });

    } catch (err) {
      reject(err);
    }
  }));
}


export default ResearchContentForm;