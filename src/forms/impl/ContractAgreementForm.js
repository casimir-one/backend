import multer from 'koa-multer';
import BaseForm from './../base/BaseForm';
import mongoose from 'mongoose';
import { getFileStorageUploader } from './../storage';

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const contractAgreementDir = fileStorage.getContractAgreementDirPath();
    const exists = await fileStorage.exists(contractAgreementDir);
    if (exists) {
      const filePath = fileStorage.getContractAgreementFilePath(file.originalname);
      const fileExists = await fileStorage.exists(filePath);
      if (fileExists) {
        await fileStorage.delete(filePath);
      }
    } else {
      await fileStorage.mkdir(contractAgreementDir);
    }

    callback(null, contractAgreementDir);
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

class ContractAgreementForm extends BaseForm {

  constructor(nextHandler) {

    const filesUploader = multer({
      storage: getFileStorageUploader(destinationHandler, filenameHandler),
      fileFilter: fileFilterHandler
    });

    const multerHandler = filesUploader.any();

    const formHandler = (ctx) => multerHandler(ctx, () => new Promise((resolve, reject) => {
      try {
        resolve({ files: ctx.req.files });
      } catch (err) {
        reject(err);
      }
    }));

    return super(formHandler, nextHandler);
  }

}


export default ContractAgreementForm;