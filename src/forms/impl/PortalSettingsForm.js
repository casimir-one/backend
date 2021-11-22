import config from '../../config';
import multer from 'koa-multer';
import BaseForm from '../base/BaseForm';
import { getFileStorageUploader } from '../storage';

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const portalId = config.TENANT
    const portalDirPath = fileStorage.getPortalDirPath(portalId);

    const exists = await fileStorage.exists(portalDirPath);
    if (!exists) {
      await fileStorage.mkdir(portalDirPath);
    }
    callback(null, portalDirPath)
  };
}


const filenameHandler = () => function () {
  return function (req, file, callback) {
    callback(null, file.originalname);
  }
}


const fileFilterHandler = (req, file, callback) => {
  const allowedAvatarMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  console.log(file.mimetype, 'file.mimetypefile.mimetype')
  if (!allowedAvatarMimeTypes.some(mime => mime === file.mimetype)) {
    return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
  }
  callback(null, true);
}

class PortalSettingsForm extends BaseForm {

  constructor(nextHandler) {

    const filesUploader = multer({
      storage: getFileStorageUploader(destinationHandler, filenameHandler),
      fileFilter: fileFilterHandler
    });

    const multerHandler = filesUploader.any();

    const formHandler = (ctx) => multerHandler(ctx, () => new Promise((resolve, reject) => {
      try {
        console.log(ctx.req.files, 'ctx.req.filesctx.req.filesctx.req.files')
        resolve({ files: ctx.req.files });
      } catch (err) {
        reject(err);
      }
    }));

    return super(formHandler, nextHandler);
  }

}


export default PortalSettingsForm;