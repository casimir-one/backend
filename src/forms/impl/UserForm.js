import multer from 'koa-multer';
import BaseForm from './../base/BaseForm';
import mongoose from 'mongoose';
import { getFileStorageUploader } from './../storage';

const USERNAME_HEADER = "entity-id";
const USER_ATTRIBUTE_ID_SPLITTER = '-';

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const _id = req.headers[USERNAME_HEADER];
    let folderPath = "";
    let filePath = "";
    const parts = file.originalname.split(USER_ATTRIBUTE_ID_SPLITTER);
    const userAttrId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(userAttrId)) {
      folderPath = fileStorage.getAccountAttributeDirPath(_id, userAttrId);
      const name = file.originalname.substring(`${userAttrId}${USER_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
      filePath = fileStorage.getAccountAttributeFilePath(_id, userAttrId, name);
    } else {
      folderPath = fileStorage.getAccountDirPath(_id);
      filePath = fileStorage.getAccountFilePath(_id, file.originalname);
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
    const parts = file.originalname.split(USER_ATTRIBUTE_ID_SPLITTER);
    const userAttrId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(userAttrId)) {
      name = file.originalname.substring(`${userAttrId}${USER_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
    } else {
      name = file.originalname;
    }

    callback(null, name);
  }
}


const fileFilterHandler = (req, file, callback) => {
  // const allowedAvatarMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  // if (!allowedAvatarMimeTypes.some(mime => mime === file.mimetype)) {
  //   return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
  // }
  callback(null, true);
}

class UserForm extends BaseForm {

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


export default UserForm;