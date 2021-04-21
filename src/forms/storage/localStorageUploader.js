import multer from 'koa-multer';
import LocalFileStorage from './../../storage/impl/LocalFileStorage';

const localStorageUploader = (destinationHandler, filenameHandler, sessionId) => multer.diskStorage({
  destination: destinationHandler(new LocalFileStorage(), sessionId)(),
  filename: filenameHandler(sessionId)()
});


export default localStorageUploader;