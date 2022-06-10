import multer from 'koa-multer';
import { getFileStorageUploader } from './../storage';
import { v4 as uuidv4 } from 'uuid';

const NFT_COLLECTION_ID = "nft-collection-id";


const destinationHandler = (fileStorage, sessionId) => function () {
  return async function (req, file, callback) {
    const projectId = req.headers[NFT_COLLECTION_ID];

    const projectFilesTempStorage = fileStorage.getProjectAwardWithdrawalRequestsTempDirPath(projectId, sessionId);
    const exists = await fileStorage.exists(projectFilesTempStorage);
    if (!exists) {
      await fileStorage.mkdir(projectFilesTempStorage);
    }

    callback(null, projectFilesTempStorage);
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