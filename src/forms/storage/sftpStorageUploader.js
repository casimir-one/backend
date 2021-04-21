import config from './../../config';
import multer from 'koa-multer';
import sftpStorage from 'multer-sftp';
import SftpFileStorage from './../../storage/impl/SftpFileStorage';


const sftpStorageUploader = (destinationHandler, filenameHandler, sessionId) => {
  return sftpStorage({
    sftp: {
      host: config.TENANT_SFTP_HOST,
      port: 22,
      username: config.TENANT_SFTP_USER,
      password: config.TENANT_SFTP_PASSWORD
    },
    destination: destinationHandler(new SftpFileStorage(), sessionId)(),
    filename: filenameHandler(sessionId)()
  })
};


export default sftpStorageUploader;