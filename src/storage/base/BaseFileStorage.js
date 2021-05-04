
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import config from './../../config';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);

const researchDir = 'research-projects';
const researchDirPath = (baseDir, researchExternalId) => `${baseDir}/${researchDir}/${researchExternalId}`;
const researchFilePath = (baseDir, researchExternalId, filename) => `${researchDirPath(baseDir, researchExternalId)}/${filename}`;
const researchAttributeDirPath = (baseDir, researchExternalId, attributeId) => `${researchDirPath(baseDir, researchExternalId)}/${attributeId}`;
const researchAttributeFilePath = (baseDir, researchExternalId, attributeId, filename) => `${researchAttributeDirPath(baseDir, researchExternalId, attributeId)}/${filename}`;
const researchContentPackageDirPath = (baseDir, researchExternalId, packageHash) => `${researchDirPath(baseDir, researchExternalId)}/${packageHash}`;
const researchContentPackageFilePath = (baseDir, researchExternalId, packageHash, fileHash) => `${researchContentPackageDirPath(baseDir, researchExternalId, packageHash)}/${fileHash}`;
const researchDarArchiveDirPath = (baseDir, researchExternalId, archiveName) => `${researchDirPath(baseDir, researchExternalId)}/${archiveName}`;
const researchDarArchiveFilePath = (baseDir, researchExternalId, archiveName, filename) => `${researchDarArchiveDirPath(baseDir, researchExternalId, archiveName)}/${filename}`;
const researchContentPackageTempDirPath = (baseDir, researchExternalId, sessionId) => `${researchDirPath(baseDir, researchExternalId)}/temp-${sessionId}`;
const researchBlankDarArchiveDirPath = () => path.join(__dirname, `./../../default/dar-blank`);

const researchAwardWithdrawalRequestsDirPath = (baseDir, researchExternalId) => `${researchDirPath(baseDir, researchExternalId)}`;
const researchAwardWithdrawalRequestsTempDirPath = (baseDir, researchExternalId, sessionId) => `${researchAwardWithdrawalRequestsDirPath(baseDir, researchExternalId)}/temp-${sessionId}`;
const researchAwardWithdrawalRequestsPackageDirPath = (baseDir, researchExternalId, packageHash) => `${researchAwardWithdrawalRequestsDirPath(baseDir, researchExternalId)}/award-withdrawal-${packageHash}`
const researchAwardWithdrawalRequestsPackageFilePath = (baseDir, researchExternalId, packageHash, fileHash) => `${researchAwardWithdrawalRequestsPackageDirPath(baseDir, researchExternalId, packageHash)}/${fileHash}`

const accountDir = 'accounts';
const accountDirPath = (baseDir, username) => `${baseDir}/${accountDir}/${username}`;
const accountAvatarFilePath = (baseDir, username, picture) => `${accountDirPath(baseDir, username)}/${picture}`
const accountDefaultAvatarFilePath = () => path.join(__dirname, `./../../default/default-avatar.png`);


const researchGroupDir = 'research-groups';
const researchGroupDirPath = (baseDir, researchGroupExternalId) => `${baseDir}/${researchGroupDir}/${researchGroupExternalId}`;
const researchGroupLogoFilePath = (baseDir, researchGroupExternalId) => `${researchGroupDirPath(baseDir, researchGroupExternalId)}/logo.png`;
const researchGroupDefaultLogoFilePath = () => path.join(__dirname, `./../../default/default-research-group-logo.png`);


const tenantDir = 'tenants';
const tenantDirPath = (baseDir, tenantExternalId) => `${baseDir}/${tenantDir}/${tenantExternalId}`;
const tenantBannerFilePath = (baseDir, tenantExternalId, filename) => `${tenantDirPath(baseDir, tenantExternalId)}/${filename}`;
const tenantLogoFilePath = (baseDir, tenantExternalId, filename) => `${tenantDirPath(baseDir, tenantExternalId)}/${filename}`;
const tenantDefaultBannerFilePath = () => path.join(__dirname, `./../../default/default-tenant-banner.png`);
const tenantDefaultLogoFilePath = () => path.join(__dirname, `./../../default/default-tenant-logo.png`);


class BaseFileStorage {

  _baseDirPath = null;
  _type = null;
  _tempDirPath = path.join(__dirname, `./../../../${config.TENANT_FILES_DIR}/temp`);

  constructor(baseDirPath) {
    this._baseDirPath = baseDirPath;
  }

  getStorageType() { 
    return this._type; 
  }

  getBaseDirPath() {
    return this._baseDirPath;
  }

  getTempDirPath(session) {
    return `${this._tempDirPath}/${session}`;
  }
  
  async mkdir(remotePath, recursive = true) { throw new Error("Not implemented"); }
  async rmdir(localPath, recursive = true) { throw new Error("Not implemented"); }
  async exists(remotePath) { throw new Error("Not implemented"); }
  async delete(remotePath, noErrorOK = false) { throw new Error("Not implemented"); }
  async get(remotePath, dst, options) { throw new Error("Not implemented"); }
  async rename(src, dst) { throw new Error("Not implemented"); }
  async calculateDirHash(remotePath, options) { throw new Error("Not implemented"); }
  async put(remotePath, buff, options = {}) { throw new Error("Not implemented"); }
  async putPassThroughStream(remotePath, passThroughSteam, options = {}) { throw new Error("Not implemented"); }


  getResearchDirPath(researchExternalId) {
    return researchDirPath(this._baseDirPath, researchExternalId);
  }

  getResearchFilePath(researchExternalId, filename) {
    return researchFilePath(this._baseDirPath, researchExternalId, filename);
  }

  getResearchAttributeDirPath(researchExternalId, attributeId) {
    return researchAttributeDirPath(this._baseDirPath, researchExternalId, attributeId);
  }

  getResearchAttributeFilePath(researchExternalId, attributeId, filename) {
    return researchAttributeFilePath(this._baseDirPath, researchExternalId, attributeId, filename);
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

  getResearchBlankDarArchiveDirPath() {
    return researchBlankDarArchiveDirPath();
  }
  
  getResearchContentPackageTempDirPath(researchExternalId, sessionId) {
    return researchContentPackageTempDirPath(this._baseDirPath, researchExternalId, sessionId);
  }

  getAccountDirPath(username) {
    return accountDirPath(this._baseDirPath, username);
  }

  getAccountAvatarFilePath(username, picture) {
    return accountAvatarFilePath(this._baseDirPath, username, picture);
  }

  getAccountDefaultAvatarFilePath() {
    return accountDefaultAvatarFilePath();
  }

  getResearchGroupDirPath(researchGroupExternalId) {
    return researchGroupDirPath(this._baseDirPath, researchGroupExternalId);
  }

  getResearchGroupLogoFilePath(researchGroupExternalId) {
    return researchGroupLogoFilePath(this._baseDirPath, researchGroupExternalId);
  }

  getResearchGroupDefaultLogoFilePath() {
    return researchGroupDefaultLogoFilePath();
  }

  getTenantDirPath(tenantExternalId) {
    return tenantDirPath(this._baseDirPath, tenantExternalId);
  }

  getTenantBannerFilePath(tenantExternalId, filename) {
    return tenantBannerFilePath(this._baseDirPath, tenantExternalId, filename);
  }

  getTenantLogoFilePath(tenantExternalId, filename) {
    return tenantLogoFilePath(this._baseDirPath, tenantExternalId, filename);
  }

  getTenantDefaultBannerFilePath() {
    return tenantDefaultBannerFilePath();
  }

  getTenantDefaultLogoFilePath() {
    return tenantDefaultLogoFilePath();
  }

  getResearchAwardWithdrawalRequestsPackageDirPath(researchExternalId, packageHash) {
    return researchAwardWithdrawalRequestsPackageDirPath(this._baseDirPath, researchExternalId, packageHash);
  }

  getResearchAwardWithdrawalRequestsTempDirPath(researchExternalId, sessionId) {
    return researchAwardWithdrawalRequestsTempDirPath(this._baseDirPath, researchExternalId, sessionId);
  }

  getResearchAwardWithdrawalRequestsPackageFilePath(researchExternalId, packageHash, fileHash) {
    return researchAwardWithdrawalRequestsPackageFilePath(this._baseDirPath, researchExternalId, packageHash, fileHash);
  }

}


export default BaseFileStorage;