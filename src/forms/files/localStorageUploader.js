import config from './../../config';
import multer from 'koa-multer';
import LocalStorage from './../../storage/local';

const localStorageUploader = (destinationHandler, filenameHandler, sessionId) => multer.diskStorage({
  destination: destinationHandler(new LocalStorage(), sessionId)(),
  filename: filenameHandler(sessionId)()
});


export default localStorageUploader;