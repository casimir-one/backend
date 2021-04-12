import config from './../config';
import LocalStorage from './local';
import SftpStorage from './sftp';
import { FILE_STORAGE } from './../constants';


const getFileStorage = () => {
  if (config.TENANT_FILE_STORAGE_TYPE == FILE_STORAGE.LOCAL_FILESYSTEM) {
    return new LocalStorage();
  } else if (config.TENANT_FILE_STORAGE_TYPE == FILE_STORAGE.REMOTE_SFTP) {
    return new SftpStorage();
  } else {
    throw new Error("File storage type is not specified");
  }
}

export default getFileStorage();