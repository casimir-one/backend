import multer from 'koa-multer';
import mongoose from 'mongoose';
import BaseForm from './../base/BaseForm';
import { getFileStorageUploader } from './../storage';


const ENTITY_ID_HEADER = "entity-id";
const PROJECT_ATTRIBUTE_ID_SPLITTER = '-';


const destinationHandler = (fileStorage) => function () {

  return async function (req, file, callback) {
    const projectId = req.headers[ENTITY_ID_HEADER];
    let folderPath = "";
    let filePath = "";

    const parts = file.originalname.split(PROJECT_ATTRIBUTE_ID_SPLITTER);
    const projectAttributeId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(projectAttributeId)) {
      folderPath = fileStorage.getProjectAttributeDirPath(projectId, projectAttributeId);
      const name = file.originalname.substring(`${projectAttributeId}${PROJECT_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
      filePath = fileStorage.getProjectAttributeFilePath(projectId, projectAttributeId, name);
    } else {
      folderPath = fileStorage.getProjectDirPath(projectId);
      filePath = fileStorage.getProjectFilePath(file.originalname);
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
    const parts = file.originalname.split(PROJECT_ATTRIBUTE_ID_SPLITTER);
    const projectAttributeId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(projectAttributeId)) {
      name = file.originalname.substring(`${projectAttributeId}${PROJECT_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
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