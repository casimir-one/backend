import localStorageUploader from './localStorageUploader';
import sftpStorageUploader from './sftpStorageUploader';
import { FILE_STORAGE } from './../../constants';
import FileStorage from './../../storage';


const getFileStorageUploader = (destinationHandler, filenameHandler) => {
  const type = FileStorage.getStorageType();
  switch (type) {
    case FILE_STORAGE.LOCAL_FILESYSTEM: {
      return localStorageUploader(destinationHandler, filenameHandler);
    }
    case FILE_STORAGE.REMOTE_SFTP: {
      return sftpStorageUploader(destinationHandler, filenameHandler);
    }
    default:
      return localStorageUploader(destinationHandler, filenameHandler);
  }
}


export {
  getFileStorageUploader
}