import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';
import util from 'util';
import multer from 'koa-multer';
import config from './../config';
import { getFileStorageUploader } from './files';
import { v4 as uuidv4 } from 'uuid';

const RESEARCH_ID_HEADER = "research-external-id";


const destinationHandler = (fileStorage, sessionId) => function () {

  return async function (req, file, callback) {
    const researchExternalId = req.headers[RESEARCH_ID_HEADER];

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


const ResearchContentPackageForm = async (ctx) => {
  const sessionId = uuidv4();

  const filesUploader = multer({
    storage: getFileStorageUploader(destinationHandler, filenameHandler, sessionId),
    fileFilter: fileFilterHandler
  });

  const formHandler = filesUploader.any();
  return formHandler(ctx, () => new Promise((resolve, reject) => {
    try {
      console.log(ctx.req.files);

      resolve({
        researchExternalId: ctx.request.headers[RESEARCH_ID_HEADER],
        title: ctx.req.body.title,
        type: ctx.req.body.type,
        authors: JSON.parse(ctx.req.body.authors),
        references: JSON.parse(ctx.req.body.references),
        tempDestinationPath: ctx.req.files[0].destination
      });

    } catch (err) {
      reject(err);
    }
  }));
}


export default ResearchContentPackageForm;