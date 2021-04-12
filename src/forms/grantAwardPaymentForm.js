import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import multer from 'koa-multer';
import config from './../config';
import { getFileStorageUploader } from './files';
import { v4 as uuidv4 } from 'uuid';

const RESEARCH_ID_HEADER = "research-external-id";


const destinationHandler = (fileStorage, sessionId) => function () {
  return async function (req, file, callback) {
    const researchExternalId = req.headers[RESEARCH_ID_HEADER];

    const researchFilesTempStorage = fileStorage.getResearchAwardWithdrawalRequestsTempDirPath(researchExternalId, sessionId);
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
  callback(null, true);
}


const GrantAwardPaymentForm = async (ctx) => {
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
        tempDestinationPath: ctx.req.files[0].destination,
        paymentNumber: ctx.req.body.paymentNumber,
        awardNumber: ctx.req.body.awardNumber,
        subawardNumber: ctx.req.body.subawardNumber,
        requester: ctx.req.body.requester,
        amount: ctx.req.body.amount,
        description: ctx.req.body.description
      });

    } catch (err) {
      reject(err);
    }
  }));
}


export default GrantAwardPaymentForm;