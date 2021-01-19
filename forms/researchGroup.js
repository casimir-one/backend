import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import config from './../config';
import multer from 'koa-multer';
import { getFileStorageUploader } from './files';

const RESEARCH_GROUP_HEADER = "research-group-external-id";


const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const researchGroupExternalId = req.headers[RESEARCH_GROUP_HEADER];
    const researchGroupDirPath = fileStorage.getResearchGroupDirPath(researchGroupExternalId);

    const exists = await fileStorage.exists(researchGroupDirPath);
    if (!exists) {
      await fileStorage.mkdir(researchGroupDirPath);
    }
    callback(null, researchGroupDirPath)
  };
}


const filenameHandler = () => function () {
  return function (req, file, callback) {
    callback(null, `logo.png`);
  }
}


const fileFilterHandler = (req, file, callback) => {
  const allowedAvatarMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedAvatarMimeTypes.some(mime => mime === file.mimetype)) {
    return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
  }
  callback(null, true);
}


// TODO: Move all research group fields here after UI form refactoring
const ResearchGroupForm = async (ctx) => {

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


export default ResearchGroupForm;