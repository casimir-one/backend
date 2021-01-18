import config from './../config';
import BaseStorage from './base';
import util from 'util';
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import rimraf from "rimraf";

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


class LocalStorage extends BaseStorage {

  constructor() {
    const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
    super(filesStoragePath);
  }

  async mkdir(remotePath, recursive = true) {
    return await ensureDir(remotePath);
  }

  async exists(remotePath) {
    try {
      const info = await stat(remotePath);
      return true;
    } catch (err) {
      return false;
    }
  }

  async delete(remotePath, noErrorOK = false) {
    const promise = new Promise((resolve, reject) => {
      rimraf(remotePath, function (err) {
        if (err) {
          console.log(err);
          reject(err)
        } else {
          resolve();
        }
      });
    });

    try {
      await promise;
      return true
    } catch (err) {
      if (noErrorOK) {
        return false;
      } else {
        throw err;
      }
    }
  }

}


export default LocalStorage;