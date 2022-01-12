import multer from 'koa-multer';
import BaseForm from './../base/BaseForm';
import { getFileStorageUploader } from './../storage';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const PROJECT_HEADER = "project-id";
const DRAFT_HEADER = "entity-id";

const destinationHandler = (fileStorage, sessionId) => function () {
  return async function (req, file, callback) {
    const projectId = req.headers[PROJECT_HEADER];
    const draftId = req.headers[DRAFT_HEADER];

    let projectFilesStorage = '';

    if (draftId && mongoose.Types.ObjectId.isValid(draftId)) {
      projectFilesStorage = fileStorage.getProjectContentPackageDirPath(projectId, draftId);
    } else {
      projectFilesStorage = fileStorage.getProjectContentPackageTempDirPath(projectId, sessionId);
    }
    const exists = await fileStorage.exists(projectFilesStorage);
    if (exists) {
      const filePath = fileStorage.getProjectContentPackageFilePath(projectId, draftId, file.originalname);
      const fileExists = await fileStorage.exists(filePath);
      if (fileExists) {
        await fileStorage.delete(filePath);
      }
    } else {
      await fileStorage.mkdir(projectFilesStorage);
    }

    callback(null, projectFilesStorage);
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