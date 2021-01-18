
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

const researchContentPackageDirPath = (baseDir, researchExternalId, packageHash) => `${researchDirPath(baseDir, researchExternalId)}/${packageHash}`;
const researchContentPackageFilePath = (baseDir, researchExternalId, packageHash, fileHash) => `${researchContentPackageDirPath(baseDir, researchExternalId, packageHash)}/${fileHash}`;

const researchDarArchiveDirPath = (baseDir, researchExternalId, archiveName) => `${researchDirPath(baseDir, researchExternalId)}/${archiveName}`;
const researchDarArchiveFilePath = (baseDir, researchExternalId, archiveName, filename) => `${researchDarArchiveDirPath(baseDir, researchExternalId, archiveName)}/${filename}`;

const researchContentPackageTempDirPath = (baseDir, researchExternalId, sessionId) => `${researchDirPath(baseDir, researchExternalId)}/temp-${sessionId}`;

class BaseStorage {

  _baseDirPath = null;
  _type = null;
  _tempDirPath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}/temp`);

  constructor(baseDirPath) {
    this._baseDirPath = baseDirPath;
  }

  getStorageType() { return this._type; }

  getBaseDirPath() {
    return this._baseDirPath;
  }

  getTempDirPath(session) {
    return `${this._tempDirPath}/${session}`;
  }
  
  async mkdir(remotePath, recursive = true) { throw new Error("Not implemented"); }
  async exists(remotePath) { throw new Error("Not implemented"); }
  async delete(remotePath, noErrorOK = false) { throw new Error("Not implemented"); }
  async get(remotePath, dst, options) { throw new Error("Not implemented"); }
  async move(src, dst) { throw new Error("Not implemented"); }
  async calculateFolderHash(remotePath, options) { throw new Error("Not implemented"); }


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

  getResearchContentPackageDirPath(researchExternalId, packageHash) {
    return researchContentPackageDirPath(this._baseDirPath, researchExternalId, packageHash);
  }

  getResearchContentPackageFilePath(researchExternalId, packageHash, fileHash) {
    return researchContentPackageFilePath(this._baseDirPath, researchExternalId, packageHash, fileHash);
  }

  getResearchDarArchiveDirPath(researchExternalId, archiveName) {
    return researchDarArchiveDirPath(this._baseDirPath, researchExternalId, archiveName);
  }

  getResearchDarArchiveFilePath(researchExternalId, archiveName, filename) {
    return researchDarArchiveFilePath(this._baseDirPath, researchExternalId, archiveName, filename);
  }

  getResearchContentPackageTempDirPath(researchExternalId, sessionId) {
    return researchContentPackageTempDirPath(this._baseDirPath, researchExternalId, sessionId);
  }


  

}


export default BaseStorage;