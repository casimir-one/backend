import BaseStorage from './base';
import SftpClient from 'ssh2-sftp-client';
import { FILE_STORAGE } from "./../constants";
import { hashElement } from 'folder-hash';
import { v4 as uuidv4 } from 'uuid';
import rimraf from "rimraf";

class SftpStorage extends BaseStorage {

  _host = null;
  _username = null;
  _password = null;

  constructor(host = '18.157.181.74', username = 'tenant-b63e7871', password = 'deipdev') {
    super('storage');
    this._host = host;
    this._username = username;
    this._password = password;
    this._type = FILE_STORAGE.DEIP_REMOTE_SFTP;
  }

  // Don't Re-use SftpClient Objects
  // https://github.com/theophilusx/ssh2-sftp-client#sec-6-4
  async run(cmd) {
    const sftp = new SftpClient(`${this._username}-storage`);
    try {
      await sftp.connect({
        host: this._host,
        username: this._username,
        password: this._password
      });
      const result = await cmd(sftp);
      await sftp.end();
      return result;
    } catch(err) {
      console.log(err);
      throw err;
    }
  }

  async mkdir(remotePath, recursive = true) {
    return await this.run(async (client) => {
      return await client.mkdir(remotePath, recursive);
    });
  }

  async exists(remotePath) {
    return await this.run(async (client) => {
      const res = await client.exists(remotePath);
      return res !== false;
    });
  }
  
  async delete(remotePath, noErrorOK = false) {
    return await this.run(async (client) => {
      return await client.delete(remotePath, noErrorOK);
    });
  }

  async get(remotePath, dst, options) {
    return await this.run(async (client) => {
      return await client.get(remotePath, dst, options);
    });
  }

  async move(src, dst) {
    return await this.run(async (client) => {
      return await client.rename(src, dst);
    });  
  }

  async calculateFolderHash(remotePath, options) {
    return await this.run(async (client) => {
      const session = uuidv4();
      const localPath = this.getTempDirPath(session);
      await client.downloadDir(remotePath, localPath);
      const hashObj = await hashElement(localPath, options);

      const rmPromise = new Promise((resolve, reject) => {
        rimraf(localPath, function (err) {
          if (err) {
            console.log(err);
            reject(err)
          } else {
            resolve();
          }
        });
      });

      await rmPromise;
      return hashObj;
    });  
  }

}


export default SftpStorage;