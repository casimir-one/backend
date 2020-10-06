import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import deipRpc from '@deip/rpc-client';
import config from './../config';
import multer from 'koa-multer';
import mongoose from 'mongoose';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);

const RESEARCH_ID_HEADER = "research-external-id";

const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);

const researchStoragePath = (researchExternalId) => `${filesStoragePath}/research-projects/${researchExternalId}`;
const researchAttributeFolderPath = (researchExternalId, researchAttributeId) => `${researchStoragePath(researchExternalId)}/${researchAttributeId}`;
const researchAttributeFilePath = (researchExternalId, researchAttributeId, filename) => `${researchAttributeFolderPath(researchExternalId, researchAttributeId)}/${filename}`;
const researchFilePath = (researchExternalId, filename) => `${researchStoragePath(researchExternalId)}/${filename}`;

const researchStorage = (destFn, filename = null) => multer.diskStorage({

  destination: async function (req, file, callback) {
    const researchExternalId = req.headers[RESEARCH_ID_HEADER];
    let folderPath = "";
    let filePath = "";
    try {
      if (filename) {
        folderPath = destFn(researchExternalId);
        filePath = `${folderPath}/${filename}`;
      } else {
        const parts = file.originalname.split('-');
        if (parts.length > 1 && mongoose.Types.ObjectId.isValid(parts[0])) {
          folderPath = destFn(researchExternalId, parts[0]);
          filePath = `${folderPath}/${parts.map((p, i) => i == 0 ? "" : p).join('')}`;
        } else {
          folderPath = destFn(researchExternalId);
          filePath = `${folderPath}/${file.originalname}`;
        }
      }

      await stat(filePath);
      await unlink(filePath);
    } catch (err) {
      await ensureDir(folderPath);
    }

    callback(null, folderPath);
  },

  filename: function (req, file, callback) {
    let name = "";
    if (filename) {
      name = filename;
    } else {
      const parts = file.originalname.split('-');
      if (parts.length > 1 && mongoose.Types.ObjectId.isValid(parts[0])) {
        name = parts.map((p, i) => i == 0 ? "" : p).join('');
      } else {
        name = file.originalname;
      }
    }
    callback(null, name);
  }
})


const researchForm = multer({
  storage: researchStorage((researchExternalId, researchAttributeId) => researchAttributeId 
    ? researchAttributeFolderPath(researchExternalId, researchAttributeId) 
    : researchStoragePath(researchExternalId)),
  fileFilter: function (req, file, callback) {
    callback(null, true);
  }
});


export {
  researchForm,

  researchStoragePath,
  researchAttributeFilePath,
  researchFilePath
}

