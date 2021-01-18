import localStorageUploader from './localStorageUploader';
import sftpStorageUploader from './sftpStorageUploader';
import { FILE_STORAGE } from './../../constants';

const getFileStorageUploader = (type, destinationHandler, filenameHandler) => {
  switch (type) {
    case FILE_STORAGE.LOCAL_FILESYSTEM: {
      return localStorageUploader(destinationHandler, filenameHandler);
    }
    case FILE_STORAGE.DEIP_REMOTE_SFTP: {
      return sftpStorageUploader(destinationHandler, filenameHandler);
    }
    default:
      return localStorageUploader(destinationHandler, filenameHandler);
  }
}


export {
  getFileStorageUploader
}