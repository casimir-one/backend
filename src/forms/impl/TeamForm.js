import multer from 'koa-multer';
import BaseForm from './../base/BaseForm';
import { getFileStorageUploader } from './../storage';

const ENTITY_ID_HEADER = "entity-id";

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const teamExternalId = req.headers[ENTITY_ID_HEADER];
    const teamDirPath = fileStorage.getResearchGroupDirPath(teamExternalId);

    const exists = await fileStorage.exists(teamDirPath);
    if (!exists) {
      await fileStorage.mkdir(teamDirPath);
    }
    callback(null, teamDirPath)
  };
}


const filenameHandler = () => function () {
  return function (req, file, callback) {
    callback(null, `logo.png`);
  }
}


const fileFilterHandler = (req, file, callback) => {
  // const allowedAvatarMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  // if (!allowedAvatarMimeTypes.some(mime => mime === file.mimetype)) {
  //   return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
  // }
  callback(null, true);
}

class TeamForm extends BaseForm {

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


export default TeamForm;