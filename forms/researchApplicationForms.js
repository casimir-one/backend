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

const PROPOSAL_ID_HEADER = "proposal-id";

const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
export const researchApplicationStoragePath = (proposalId) => `${filesStoragePath}/research-projects-applications/${proposalId}`;

export const researchApplicationAttachmentFolderPath = (proposalId) => `${researchApplicationStoragePath(proposalId)}`;
export const researchApplicationAttachmentFilePath = (proposalId, filename) => `${researchApplicationAttachmentFolderPath(proposalId)}/${filename}`;

const researchApplicationStorage = (destFn, filename = null) => multer.diskStorage({
  destination: async function (req, file, callback) {
    const proposalId = req.headers[PROPOSAL_ID_HEADER];;
    const folderPath = destFn(proposalId);

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


const allowedAttachmentsMimeTypes = ['application/pdf'];
export const researchApplicationForm = multer({
  storage: researchApplicationStorage((proposalId) => researchApplicationAttachmentFolderPath(proposalId)),
  fileFilter: function (req, file, callback) {
    // if (!allowedAttachmentsMimeTypes.some(mime => mime === file.mimetype)) {
    //   return callback(new Error('Only the following mime types are allowed: ' + allowedAttachmentsMimeTypes.join(', ')), false);
    // }
    callback(null, true);
  }
});
