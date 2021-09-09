import multer from 'koa-multer';
import BaseForm from './../base/BaseForm';
import { getFileStorageUploader } from './../storage';
import { v4 as uuidv4 } from 'uuid';

const PROJECT_HEADER = "project-id";

const destinationHandler = (fileStorage, sessionId) => function () {
  return async function (req, file, callback) {
    const projectId = req.headers[PROJECT_HEADER];

    const projectFilesTempStorage = fileStorage.getResearchContentPackageTempDirPath(projectId, sessionId);
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

class ProjectContentPackageForm extends BaseForm {

  constructor(nextHandler) {
    const sessionId = uuidv4();

    const filesUploader = multer({
      storage: getFileStorageUploader(destinationHandler, filenameHandler, sessionId),
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


export default ProjectContentPackageForm;