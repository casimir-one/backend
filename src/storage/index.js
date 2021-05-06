import config from './../config';
import LocalFileStorage from './impl/LocalFileStorage';
import SftpFileStorage from './impl/SftpFileStorage';
import { FILE_STORAGE } from './../constants';


const getFileStorage = () => {
  if (config.TENANT_FILE_STORAGE_TYPE == FILE_STORAGE.LOCAL_FILESYSTEM) {
    return new LocalFileStorage();
  } else if (config.TENANT_FILE_STORAGE_TYPE == FILE_STORAGE.REMOTE_SFTP) {
    return new SftpFileStorage();
  } else {
    throw new Error("File storage type is not specified");
  }
}

export default getFileStorage();