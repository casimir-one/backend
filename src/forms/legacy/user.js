import multer from 'koa-multer';
import mongoose from 'mongoose';
import { getFileStorageUploader } from './../storage';

const USERNAME_HEADER = "username";
const USER_ATTRIBUTE_ID_SPLITTER = '-';

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const username = req.headers[USERNAME_HEADER];
    let folderPath = "";
    let filePath = "";

    const parts = file.originalname.split(USER_ATTRIBUTE_ID_SPLITTER);
    const userAttrId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(userAttrId)) {
      folderPath = fileStorage.getAccountAttributeDirPath(username, userAttrId);
      const name = file.originalname.substring(`${userAttrId}${USER_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
      filePath = fileStorage.getAccountAttributeFilePath(username, userAttrId, name);
    } else {
      folderPath = fileStorage.getAccountDirPath(username);
      filePath = fileStorage.getAccountFilePath(username, file.originalname);
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


// TODO: Move all user fields here after UI form refactoring
const UserForm = async (ctx) => {

  const filesUploader = multer({
    storage: getFileStorageUploader(destinationHandler, filenameHandler),
    fileFilter: fileFilterHandler
  });

  const formHandler = filesUploader.any();
  return formHandler(ctx, () => new Promise((resolve, reject) => {
    try {
      const filename = ctx.req.files.length ? ctx.req.files[0].filename : '';
      const profile = JSON.parse(ctx.req.body.profile);
      resolve({
        profile,
        filename
      });
    } catch (err) {
      reject(err);
    }
  }));
  
}


export default UserForm;