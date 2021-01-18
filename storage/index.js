import config from './../config';
import LocalStorage from './local';
import SftpStorage from './sftp';

const sftpStorage = new SftpStorage();
// const localStorage = new LocalStorage();

export default sftpStorage;
// export default localStorage;