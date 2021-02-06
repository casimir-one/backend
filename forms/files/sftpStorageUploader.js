import config from './../../config';
import multer from 'koa-multer';
import sftpStorage from 'multer-sftp';
import SftpStorage from './../../storage/sftp';


const sftpStorageUploader = (destinationHandler, filenameHandler) => {
  return sftpStorage({
    sftp: {
      host: config.TENANT_SFTP_HOST,
      port: 22,
      username: config.TENANT_SFTP_USER,
      password: config.TENANT_SFTP_PASSWORD
    },
    destination: destinationHandler(new SftpStorage())(),
    filename: filenameHandler()()
  })
};


export default sftpStorageUploader;