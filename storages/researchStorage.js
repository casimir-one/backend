import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import config from './../config';
import multer from 'koa-multer';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);

const RESEARCH_ID_HEADER = "research-external-id";

const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
export const researchStoragePath = (researchId) => `${filesStoragePath}/research-projects/${researchId}`;

export const researchBackgroundImageFolderPath = (researchId) => `${researchStoragePath(researchId)}`;
export const researchBackgroundImageFilePath = (researchId, filename = `background.png`) => `${researchBackgroundImageFolderPath(researchId)}/${filename}`;
export const defaultResearchBackgroundImagePath = () => path.join(__dirname, `./../default/default-research-background.png`);


const researchFilesStorage = (destFn, filename = null) => multer.diskStorage({
  destination: async function (req, file, callback) {
    const researchExternalId = req.headers[RESEARCH_ID_HEADER];;
    const folderPath = destFn(researchExternalId);

    try {
      const filePath = `${folderPath}/${filename ? filename : file.originalname}`;
      await stat(filePath);
      await unlink(filePath);
    } catch (err) {
      await ensureDir(folderPath);
    }

    callback(null, folderPath);
  },
  filename: function (req, file, callback) {
    callback(null, filename ? filename : file.originalname);
  }
})


const allowedBackgroundMimeTypes = ['image/png'];
export const researchBackgroundImageFormUploader = multer({
  storage: researchFilesStorage((researchExternalId) => researchBackgroundImageFolderPath(researchExternalId), `background.png`),
  fileFilter: function (req, file, callback) {
    if (!allowedBackgroundMimeTypes.some(mime => mime === file.mimetype)) {
      return callback(new Error('Only the following mime types are allowed: ' + allowedBackgroundMimeTypes.join(', ')), false);
    }
    callback(null, true);
  }
})