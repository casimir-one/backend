import multer from 'koa-multer';
import BaseForm from '../base/BaseForm';
import { getFileStorageUploader } from '../storage';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const NFT_COLLECTION_ID = "nft-collection-id";
const DRAFT_HEADER = "entity-id";

const destinationHandler = (fileStorage, sessionId) => function () {
  return async function (req, file, callback) {
    const nftCollectionId = req.headers[NFT_COLLECTION_ID];
    const draftId = req.headers[DRAFT_HEADER];

    let nftCollectionFilesStorage = '';

    if (draftId && mongoose.Types.ObjectId.isValid(draftId)) {
      nftCollectionFilesStorage = fileStorage.getNFTItemMetadataPackageDirPath(nftCollectionId, draftId);
    } else {
      nftCollectionFilesStorage = fileStorage.getNFTItemMetadataPackageTempDirPath(nftCollectionId, sessionId);
    }
    const exists = await fileStorage.exists(nftCollectionFilesStorage);
    if (exists) {
      const filePath = fileStorage.getNFTItemMetadataPackageFilePath(nftCollectionId, draftId, file.originalname);
      const fileExists = await fileStorage.exists(filePath);
      if (fileExists) {
        await fileStorage.delete(filePath);
      }
    } else {
      await fileStorage.mkdir(nftCollectionFilesStorage);
    }

    callback(null, nftCollectionFilesStorage);
  };
}


const filenameHandler = () => function () {
  return function (req, file, callback) {
    callback(null, file.originalname);
  }
}


const fileFilterHandler = (req, file, callback) => {
  callback(null, true);
}

class NFTItemMetadataForm extends BaseForm {

  constructor(nextHandler) {
    const sessionId = uuidv4();

    const filesUploader = multer({
      storage: getFileStorageUploader(destinationHandler, filenameHandler, sessionId),
      fileFilter: fileFilterHandler
    });

    const multerHandler = filesUploader.any();

    const formHandler = (ctx) => multerHandler(ctx, () => new Promise((resolve, reject) => {
      try {
        resolve({ files: ctx.req.files });
      } catch (err) {
        reject(err);
      }
    }));

    return super(formHandler, nextHandler);
  }

}


export default NFTItemMetadataForm;