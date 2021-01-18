import config from './../../config';
import multer from 'koa-multer';
import sftpStorage from 'multer-sftp';
import SftpStorage from './../../storage/sftp';


const sftpStorageUploader = (destinationHandler, filenameHandler) => {
  return sftpStorage({
    sftp: {
      host: '18.157.181.74',
      port: 22,
      username: 'tenant-b63e7871',
      password: 'deipdev'
    },
    destination: destinationHandler(new SftpStorage())(),
    filename: filenameHandler()()
  })
};


export default sftpStorageUploader;