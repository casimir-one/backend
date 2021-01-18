import config from './../config';
import BaseStorage from './base';
import util from 'util';
import fs from 'fs';
import path from 'path';
import fsExtra from 'fs-extra';
import rimraf from "rimraf";
import { FILE_STORAGE } from "./../constants";
import { hashElement } from 'folder-hash';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


class LocalStorage extends BaseStorage {

  constructor() {
    const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
    super(filesStoragePath);
    this._type = FILE_STORAGE.LOCAL_FILESYSTEM;
  }

  async mkdir(localPath, recursive = true) {
    return await ensureDir(localPath);
  }

  async exists(localPath) {
    try {
      const info = await stat(localPath);
      return true;
    } catch (err) {
      return false;
    }
  }

  async delete(localPath, noErrorOK = false) {
    const promise = new Promise((resolve, reject) => {
      rimraf(localPath, function (err) {
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

  async get(localPath, dst, options) {

    const promise = new Promise((resolve, reject) => {
      // Store file data chunks in this array
      let chunks = [];
      // We can use this variable to store the final data
      let fileBuffer;

      // Read file into stream.Readable
      let fileStream = fs.createReadStream(localPath);

      // An error occurred with the stream
      fileStream.once('error', (err) => {
        // Be sure to handle this properly!
        console.error(err);
        reject(err);
      });

      // File is done being read
      fileStream.once('end', () => {
        // create the final data Buffer from data chunks;
        fileBuffer = Buffer.concat(chunks);
        resolve(fileBuffer);
      });

      // Data is flushed from fileStream in chunks,
      // this callback will be executed for each chunk
      fileStream.on('data', (chunk) => {
        chunks.push(chunk); // push data chunk to array
      });

    });

    const buff = await promise;
    return buff;
  }

  async move(src, dst) {
    return await fsExtra.move(src, dst, { overwrite: true });
  }

  async calculateFolderHash(localPath, options) {
    const hashObj = await hashElement(localPath, options);
    return hashObj;
  }

}


export default LocalStorage;