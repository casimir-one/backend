import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import config from './../config';
import multer from 'koa-multer';
import mongoose from 'mongoose';
import { getFileStorageUploader } from './files';
import { FILE_STORAGE } from './../constants';

const RESEARCH_ID_HEADER = "research-external-id";
const RESEARCH_ATTRIBUTE_ID_SPLITTER = '-';


const destinationHandler = (fileStorage) => function () {

  return async function (req, file, callback) {
    const researchExternalId = req.headers[RESEARCH_ID_HEADER];
    let folderPath = "";
    let filePath = "";

    const parts = file.originalname.split(RESEARCH_ATTRIBUTE_ID_SPLITTER);
    const researchAttributeId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(researchAttributeId)) {
      folderPath = fileStorage.getResearchAttributeDirPath(researchExternalId, researchAttributeId);
      const name = file.originalname.substring(`${researchAttributeId}${RESEARCH_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
      filePath = fileStorage.getResearchAttributeFilePath(researchExternalId, researchAttributeId, name);
    } else {
      folderPath = fileStorage.getResearchDirPath(researchExternalId);
      filePath = fileStorage.getResearchFilePath(file.originalname);
    }

    const folderExists = await fileStorage.exists(folderPath);
    if (folderExists) {
      const fileExists = await fileStorage.exists(filePath);
      if (fileExists) {
        await fileStorage.delete(filePath);
      }
    } else {
      await fileStorage.mkdir(folderPath);
    }

    callback(null, folderPath);
  };
}


const filenameHandler = () => function () {

  return function (req, file, callback) {
    let name = "";
    const parts = file.originalname.split(RESEARCH_ATTRIBUTE_ID_SPLITTER);
    const researchAttributeId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(researchAttributeId)) {
      name = file.originalname.substring(`${researchAttributeId}${RESEARCH_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
    } else {
      name = file.originalname;
    }

    callback(null, name);
  }
}


const fileFilterHandler = (req, file, callback) => {
  // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
  //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
  // }
  callback(null, true);
}


const ResearchForm = async (ctx, storageType = FILE_STORAGE.DEIP_REMOTE_SFTP) => {

  const filesUploader = multer({
    storage: getFileStorageUploader(storageType, destinationHandler, filenameHandler),
    fileFilter: fileFilterHandler
  });

  const formHandler = filesUploader.any();

  return formHandler(ctx, () => new Promise((resolve, reject) => {

    try {

      const tx = JSON.parse(ctx.req.body.tx);
      const onchainData = JSON.parse(ctx.req.body.onchainData);
      const offchainMeta = JSON.parse(ctx.req.body.offchainMeta);
      const isProposal = ctx.req.body.isProposal === 'true';
      console.log(ctx.req.files);

      resolve({
        tx,
        offchainMeta,
        onchainData,
        isProposal
      });

    } catch (err) {
      reject(err);
    }

  }));
}


export default ResearchForm;