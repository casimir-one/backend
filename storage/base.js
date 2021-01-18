
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import config from './../config';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);

const researchDir = 'research-projects';
const researchDirPath = (baseDir, researchExternalId) => `${baseDir}/${researchDir}/${researchExternalId}`;
const researchFilePath = (baseDir, researchExternalId, filename) => `${researchDirPath(baseDir, researchExternalId)}/${filename}`;
const researchAttributeDirPath = (baseDir, researchExternalId, researchAttributeId) => `${researchDirPath(baseDir, researchExternalId)}/${researchAttributeId}`;
const researchAttributeFilePath = (baseDir, researchExternalId, researchAttributeId, filename) => `${researchAttributeDirPath(baseDir, researchExternalId, researchAttributeId)}/${filename}`;


class BaseStorage {

  _baseDirPath = null;

  constructor(baseDirPath) {
    this._baseDirPath = baseDirPath;
  }

  getBaseDir() {
    return this._baseDirPath;
  }

  async mkdir(remotePath, recursive = true) { throw new Error("Not implemented"); }
  async exists(remotePath) { throw new Error("Not implemented"); }
  async delete(remotePath, noErrorOK = false) { throw new Error("Not implemented"); }

  getResearchDirPath(researchExternalId) {
    return researchDirPath(this._baseDirPath, researchExternalId);
  }

  getResearchFilePath(researchExternalId, filename) {
    return researchFilePath(this._baseDirPath, researchExternalId, filename);
  }

  getResearchAttributeDirPath(researchExternalId, researchAttributeId) {
    return researchAttributeDirPath(this._baseDirPath, researchExternalId, researchAttributeId);
  }

  getResearchAttributeFilePath(researchExternalId, researchAttributeId, filename) {
    return researchAttributeFilePath(this._baseDirPath, researchExternalId, researchAttributeId, filename);
  }

}


export default BaseStorage;