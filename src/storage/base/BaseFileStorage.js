
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import config from './../../config';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);

const nftCollectionDir = 'nft-collections';
const nftCollectionDirPath = (baseDir, nftCollectionId) => `${baseDir}/${nftCollectionDir}/${nftCollectionId}`;
const nftCollectionFilePath = (baseDir, nftCollectionId, filename) => `${nftCollectionDirPath(baseDir, nftCollectionId)}/${filename}`;
const nftCollectionAttributeDirPath = (baseDir, nftCollectionId, attributeId) => `${nftCollectionDirPath(baseDir, nftCollectionId)}/${attributeId}`;
const nftCollectionAttributeFilePath = (baseDir, nftCollectionId, attributeId, filename) => `${nftCollectionAttributeDirPath(baseDir, nftCollectionId, attributeId)}/${filename}`;
const nftCollectionArchiveDirPath = (baseDir, nftCollectionId, archiveName) => `${nftCollectionDirPath(baseDir, nftCollectionId)}/${archiveName}`;
const nftItemMetadataDirPath = (baseDir, nftCollectionId, nftItemId) => `${nftCollectionDirPath(baseDir, nftCollectionId)}/${nftItemId}`;
const nftItemMetadataFilePath = (baseDir, nftCollectionId, nftItemId, filename) => `${nftItemMetadataDirPath(baseDir, nftCollectionId, nftItemId)}/${filename}`;
const nftItemMetadataAttributeDirPath = (baseDir, nftCollectionId, nftItemId, attributeId) => `${nftItemMetadataDirPath(baseDir, nftCollectionId, nftItemId)}/${attributeId}`;
const nftItemMetadataAttributeFilePath = (baseDir, nftCollectionId, nftItemId, attributeId, filename) => `${nftItemMetadataAttributeDirPath(baseDir, nftCollectionId, nftItemId, attributeId)}/${filename}`;

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


  getNFTCollectionDirPath(nftCollectionId) {
    return nftCollectionDirPath(this._baseDirPath, nftCollectionId);
  }

  getNFTCollectionFilePath(nftCollectionId, filename) {
    return nftCollectionFilePath(this._baseDirPath, nftCollectionId, filename);
  }

  getNFTCollectionAttributeDirPath(nftCollectionId, attributeId) {
    return nftCollectionAttributeDirPath(this._baseDirPath, nftCollectionId, attributeId);
  }

  getNFTCollectionAttributeFilePath(nftCollectionId, attributeId, filename) {
    return nftCollectionAttributeFilePath(this._baseDirPath, nftCollectionId, attributeId, filename);
  }

  getNFTItemMetadataDirPath(nftCollectionId, nftItemId) {
    return nftItemMetadataDirPath(this._baseDirPath, nftCollectionId, nftItemId);
  }

  getNFTItemMetadataFilePath(nftCollectionId, nftItemId, filename) {
    return nftItemMetadataFilePath(this._baseDirPath, nftCollectionId, nftItemId, filename);
  }

  getNFTItemMetadataAttributeDirPath(nftCollectionId, nftItemId, attributeId) {
    return nftItemMetadataAttributeDirPath(this._baseDirPath, nftCollectionId, nftItemId, attributeId);
  }

  getNFTItemMetadataAttributeFilePath(nftCollectionId, nftItemId, attributeId, filename) {
    return nftItemMetadataAttributeFilePath(this._baseDirPath, nftCollectionId, nftItemId, attributeId, filename);
  }

  getNFTCollectionArchiveDirPath(nftCollectionId, archiveName) {
    return nftCollectionArchiveDirPath(this._baseDirPath, nftCollectionId, archiveName);
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
}


export default BaseFileStorage;