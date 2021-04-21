import BaseFileStorage from './../base/BaseFileStorage';
import fs from 'fs';
import SftpClient from 'ssh2-sftp-client';
import { FILE_STORAGE } from "./../../constants";
import { hashElement } from 'folder-hash';
import { v4 as uuidv4 } from 'uuid';
import rimraf from "rimraf";
import config from "./../../config";


class SftpFileStorage extends BaseFileStorage {

  _host = null;
  _username = null;
  _password = null;

  constructor(host = config.TENANT_SFTP_HOST, username = config.TENANT_SFTP_USER, password = config.TENANT_SFTP_PASSWORD) {
    super('storage');
    this._host = host;
    this._username = username;
    this._password = password;
    this._type = FILE_STORAGE.REMOTE_SFTP;
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

  async rmdir(remotePath, recursive = true) {
    return await this.run(async (client) => {
      return await client.rmdir(remotePath, recursive);
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

  async get(remotePath, dst, options = {}) {
    return await this.run(async (client) => {
      return await client.get(remotePath, dst, options);
    });
  }

  async put(remotePath, data, options = {}){
    return await this.run(async (client) => {
      return await client.put(data, remotePath, options);
    });
  }

  async putPassThroughStream(remotePath, passThroughSteam, options = {}) {
    return await this.run(async (client) => {

      const promise = new Promise((resolve, reject) => {

        const session = uuidv4();
        const tempLocalPath = this.getTempDirPath(session);
        const file = fs.createWriteStream(tempLocalPath);
        passThroughSteam.pipe(file);

        file.on('close', async () => {
          try {
            const result = await client.put(tempLocalPath, remotePath, options);
            resolve(result);
          } catch (err) {
            reject(err);
          }
          rimraf(tempLocalPath, (err) => { if (err) { console.log(err); } });
        });

        file.on('error', async (err) => {
          reject(err);
        })
      });

      return await promise;
    });
  }

  async rename(src, dst) {
    return await this.run(async (client) => {
      return await client.rename(src, dst);
    });  
  }

  async calculateDirHash(remotePath, options) {
    return await this.run(async (client) => {
      const session = uuidv4();
      const tempLocalPath = this.getTempDirPath(session);
      await client.downloadDir(remotePath, tempLocalPath);
      const hashObj = await hashElement(tempLocalPath, options);
      rimraf(tempLocalPath, (err) => { if (err) { console.log(err); } });
      return hashObj;
    });  
  }

  async uploadDir(localPath, remotePath) {
    return await this.run(async (client) => {
      const result = await client.uploadDir(localPath, remotePath);
      return result;
    });
  }

  async listDir(remoteDir) {
    return await this.run(async (client) => {
      const items = await client.list(remoteDir);
      return items.map(item => item.name);
    });
  }

  async stat(remoteDir) {
    return await this.run(async (client) => {
      const result = await client.stat(remoteDir);
      return result;
    });
  }
}


export default SftpFileStorage;