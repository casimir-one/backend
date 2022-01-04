
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import config from './../../config';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);

const projectDir = 'projects';
const projectDirPath = (baseDir, projectId) => `${baseDir}/${projectDir}/${projectId}`;
const projectFilePath = (baseDir, projectId, filename) => `${projectDirPath(baseDir, projectId)}/${filename}`;
const projectAttributeDirPath = (baseDir, projectId, attributeId) => `${projectDirPath(baseDir, projectId)}/${attributeId}`;
const projectAttributeFilePath = (baseDir, projectId, attributeId, filename) => `${projectAttributeDirPath(baseDir, projectId, attributeId)}/${filename}`;
const projectContentPackageDirPath = (baseDir, projectId, packageHash) => `${projectDirPath(baseDir, projectId)}/${packageHash}`;
const projectContentPackageFilePath = (baseDir, projectId, packageHash, fileHash) => `${projectContentPackageDirPath(baseDir, projectId, packageHash)}/${fileHash}`;
const projectDarArchiveDirPath = (baseDir, projectId, archiveName) => `${projectDirPath(baseDir, projectId)}/${archiveName}`;
const projectDarArchiveFilePath = (baseDir, projectId, archiveName, filename) => `${projectDarArchiveDirPath(baseDir, projectId, archiveName)}/${filename}`;
const projectContentPackageTempDirPath = (baseDir, projectId, sessionId) => `${projectDirPath(baseDir, projectId)}/temp-${sessionId}`;
const projectBlankDarArchiveDirPath = () => path.join(__dirname, `./../../default/dar-blank`);

const projectAwardWithdrawalRequestsDirPath = (baseDir, projectId) => `${projectDirPath(baseDir, projectId)}`;
const projectAwardWithdrawalRequestsTempDirPath = (baseDir, projectId, sessionId) => `${projectAwardWithdrawalRequestsDirPath(baseDir, projectId)}/temp-${sessionId}`;
const projectAwardWithdrawalRequestsPackageDirPath = (baseDir, projectId, packageHash) => `${projectAwardWithdrawalRequestsDirPath(baseDir, projectId)}/award-withdrawal-${packageHash}`
const projectAwardWithdrawalRequestsPackageFilePath = (baseDir, projectId, packageHash, fileHash) => `${projectAwardWithdrawalRequestsPackageDirPath(baseDir, projectId, packageHash)}/${fileHash}`

const accountDir = 'accounts';
const accountDirPath = (baseDir, username) => `${baseDir}/${accountDir}/${username}`;
const accountFilePath = (baseDir, username, filename) => `${accountDirPath(baseDir, username)}/${filename}`;
const accountAttributeDirPath = (baseDir, username, attributeId) => `${accountDirPath(baseDir, username)}/${attributeId}`;
const accountAttributeFilePath = (baseDir, username, attributeId, filename) => `${accountAttributeDirPath(baseDir, username, attributeId)}/${filename}`;
const accountAvatarFilePath = (baseDir, username, picture) => `${accountDirPath(baseDir, username)}/${picture}`
const accountDefaultAvatarFilePath = () => path.join(__dirname, `./../../default/default-avatar.png`);


const teamDir = 'teams';
const teamDirPath = (baseDir, teamId) => `${baseDir}/${teamDir}/${teamId}`;
const teamFilePath = (baseDir, teamId, filename) => `${teamDirPath(baseDir, teamId)}/${filename}`;
const teamAttributeDirPath = (baseDir, teamId, attributeId) => `${teamDirPath(baseDir, teamId)}/${attributeId}`;
const teamAttributeFilePath = (baseDir, teamId, attributeId, filename) => `${teamAttributeDirPath(baseDir, teamId, attributeId)}/${filename}`;
const teamLogoFilePath = (baseDir, teamId) => `${teamDirPath(baseDir, teamId)}/logo.png`;
const teamDefaultLogoFilePath = () => path.join(__dirname, `./../../default/default-team-logo.png`);


const portalDir = 'portals';
const portalDirPath = (baseDir, portalId) => `${baseDir}/${portalDir}/${portalId}`;
const portalBannerFilePath = (baseDir, portalId, filename) => `${portalDirPath(baseDir, portalId)}/${filename}`;
const portalLogoFilePath = (baseDir, portalId, filename) => `${portalDirPath(baseDir, portalId)}/${filename}`;
const portalDefaultBannerFilePath = () => path.join(__dirname, `./../../default/default-portal-banner.png`);
const portalDefaultLogoFilePath = () => path.join(__dirname, `./../../default/default-portal-logo.png`);

const contractAgreementDir = 'contracts';
const contractAgreementDirPath = (baseDir) => `${baseDir}/${contractAgreementDir}`;
const contractAgreementFilePath = (baseDir, filename) => `${contractAgreementDirPath(baseDir)}/${filename}`;


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


  getProjectDirPath(projectId) {
    return projectDirPath(this._baseDirPath, projectId);
  }

  getProjectFilePath(projectId, filename) {
    return projectFilePath(this._baseDirPath, projectId, filename);
  }

  getProjectAttributeDirPath(projectId, attributeId) {
    return projectAttributeDirPath(this._baseDirPath, projectId, attributeId);
  }

  getProjectAttributeFilePath(projectId, attributeId, filename) {
    return projectAttributeFilePath(this._baseDirPath, projectId, attributeId, filename);
  }

  getProjectContentPackageDirPath(projectId, packageHash) {
    return projectContentPackageDirPath(this._baseDirPath, projectId, packageHash);
  }

  getProjectContentPackageFilePath(projectId, packageHash, fileHash) {
    return projectContentPackageFilePath(this._baseDirPath, projectId, packageHash, fileHash);
  }

  getProjectDarArchiveDirPath(projectId, archiveName) {
    return projectDarArchiveDirPath(this._baseDirPath, projectId, archiveName);
  }

  getProjectDarArchiveFilePath(projectId, archiveName, filename) {
    return projectDarArchiveFilePath(this._baseDirPath, projectId, archiveName, filename);
  }

  getProjectBlankDarArchiveDirPath() {
    return projectBlankDarArchiveDirPath();
  }
  
  getProjectContentPackageTempDirPath(projectId, sessionId) {
    return projectContentPackageTempDirPath(this._baseDirPath, projectId, sessionId);
  }

  getAccountDirPath(username) {
    return accountDirPath(this._baseDirPath, username);
  }

  getAccountAttributeDirPath(username, attributeId) {
    return accountAttributeDirPath(this._baseDirPath, username, attributeId);
  }

  getAccountAttributeFilePath(username, attributeId, filename) {
    return accountAttributeFilePath(this._baseDirPath, username, attributeId, filename);
  }

  getAccountFilePath(username, filename) {
    return accountFilePath(this._baseDirPath, username, filename);
  }

  getAccountAvatarFilePath(username, picture) {
    return accountAvatarFilePath(this._baseDirPath, username, picture);
  }

  getAccountDefaultAvatarFilePath() {
    return accountDefaultAvatarFilePath();
  }

  getTeamDirPath(teamId) {
    return teamDirPath(this._baseDirPath, teamId);
  }

  getTeamAttributeDirPath(teamId, attributeId) {
    return teamAttributeDirPath(this._baseDirPath, teamId, attributeId);
  }

  getTeamAttributeFilePath(teamId, attributeId, filename) {
    return teamAttributeFilePath(this._baseDirPath, teamId, attributeId, filename);
  }

  getTeamFilePath(teamId, filename) {
    return teamFilePath(this._baseDirPath, teamId, filename);
  }

  getTeamLogoFilePath(teamId) {
    return teamLogoFilePath(this._baseDirPath, teamId);
  }

  getTeamDefaultLogoFilePath() {
    return teamDefaultLogoFilePath();
  }

  getPortalDirPath(portalId) {
    return portalDirPath(this._baseDirPath, portalId);
  }

  getPortalBannerFilePath(portalId, filename) {
    return portalBannerFilePath(this._baseDirPath, portalId, filename);
  }

  getPortalLogoFilePath(portalId, filename) {
    return portalLogoFilePath(this._baseDirPath, portalId, filename);
  }

  getPortalDefaultBannerFilePath() {
    return portalDefaultBannerFilePath();
  }

  getPortalDefaultLogoFilePath() {
    return portalDefaultLogoFilePath();
  }

  getProjectAwardWithdrawalRequestsPackageDirPath(projectId, packageHash) {
    return projectAwardWithdrawalRequestsPackageDirPath(this._baseDirPath, projectId, packageHash);
  }

  getProjectAwardWithdrawalRequestsTempDirPath(projectId, sessionId) {
    return projectAwardWithdrawalRequestsTempDirPath(this._baseDirPath, projectId, sessionId);
  }

  getProjectAwardWithdrawalRequestsPackageFilePath(projectId, packageHash, fileHash) {
    return projectAwardWithdrawalRequestsPackageFilePath(this._baseDirPath, projectId, packageHash, fileHash);
  }

  getContractAgreementDirPath() {
    return contractAgreementDirPath(this._baseDirPath);
  }

  getContractAgreementFilePath(filename) {
    return contractAgreementFilePath(this._baseDirPath, filename);
  }

}


export default BaseFileStorage;