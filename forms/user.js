import config from './../config';
import multer from 'koa-multer';
import { getFileStorageUploader } from './files';

const USERNAME_HEADER = "username";

const destinationHandler = (fileStorage) => function () {
  return async function (req, file, callback) {
    const username = req.headers[USERNAME_HEADER];
    const accountsDirPath = fileStorage.getAccountsDirPath(username);

    const exists = await fileStorage.exists(accountsDirPath);
    if (!exists) {
      await fileStorage.mkdir(accountsDirPath);
    }
    callback(null, accountsDirPath)
  };
}


const filenameHandler = () => function () {
  return function (req, file, callback) {
    const username = req.headers[USERNAME_HEADER];
    const ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
    callback(null, `${username}.${ext}`);
  }
}


const fileFilterHandler = (req, file, callback) => {
  const allowedAvatarMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (allowedAvatarMimeTypes.find(mime => mime === file.mimetype) === undefined) {
    return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
  }
  callback(null, true);
}


// TODO: Move all user fields here after
const UserForm = async (ctx) => {

  const filesUploader = multer({
    storage: getFileStorageUploader(destinationHandler, filenameHandler),
    fileFilter: fileFilterHandler
  });

  const formHandler = filesUploader.any();
  return formHandler(ctx, () => new Promise((resolve, reject) => {
    try {
      resolve({ 
        filename: ctx.req.files[0].filename
      });
    } catch (err) {
      reject(err);
    }
  }));
  
}


export default UserForm;