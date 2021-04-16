import multer from 'koa-multer';
import mongoose from 'mongoose';
import BaseForm from './../base/BaseForm';
import { getFileStorageUploader } from './../storage';


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
  // const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']
  // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
  //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
  // }
  callback(null, true);
}


class ProjectForm extends BaseForm {

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



module.exports = ProjectForm;