import config from './../../config';
import multer from 'koa-multer';
import LocalStorage from './../../storage/local';

const localStorageUploader = (destinationHandler, filenameHandler) => multer.diskStorage({
  destination: destinationHandler(new LocalStorage())(),
  filename: filenameHandler()()
});


export default localStorageUploader;