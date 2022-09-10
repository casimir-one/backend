import multer from 'koa-multer';
import mongoose from 'mongoose';
import BaseForm from '../base/BaseForm';
import { getFileStorageUploader } from '../storage';


const ENTITY_ID_HEADER = "entity-id";
const NFT_COLLECTION_ATTRIBUTE_ID_SPLITTER = '-';


const destinationHandler = (fileStorage) => function () {

  return async function (req, file, callback) {
    const nftCollectionId = req.headers[ENTITY_ID_HEADER];
    let folderPath = "";
    let filePath = "";

    const parts = file.originalname.split(NFT_COLLECTION_ATTRIBUTE_ID_SPLITTER);
    const nftCollectionAttributeId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(nftCollectionAttributeId)) {
      folderPath = fileStorage.getNFTCollectionAttributeDirPath(nftCollectionId, nftCollectionAttributeId);
      const name = file.originalname.substring(`${nftCollectionAttributeId}${NFT_COLLECTION_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
      filePath = fileStorage.getNFTCollectionAttributeFilePath(nftCollectionId, nftCollectionAttributeId, name);
    } else {
      folderPath = fileStorage.getNFTCollectionDirPath(nftCollectionId);
      filePath = fileStorage.getNFTCollectionFilePath(nftCollectionId, file.originalname);
    }

    const folderExists = await fileStorage.exists(folderPath);
    if (folderExists) {
      const fileExists = await fileStorage.exists(filePath);
      if (fileExists) {
        await fileStorage.delete(filePath);
      }
    } else {
      await fileStorage.mkdir(folderPath);
    }

    callback(null, folderPath);
  };
}


const filenameHandler = () => function () {

  return function (req, file, callback) {
    let name = "";
    const parts = file.originalname.split(NFT_COLLECTION_ATTRIBUTE_ID_SPLITTER);
    const nftCollectionAttributeId = parts[0];
    if (parts.length > 1 && mongoose.Types.ObjectId.isValid(nftCollectionAttributeId)) {
      name = file.originalname.substring(`${nftCollectionAttributeId}${NFT_COLLECTION_ATTRIBUTE_ID_SPLITTER}`.length, file.originalname.length);
    } else {
      name = file.originalname;
    }

    callback(null, name);
  }
}


const fileFilterHandler = (req, file, callback) => {
  // const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']
  // if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
  //     return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
  // }
  callback(null, true);
}


class NFTCollectionForm extends BaseForm {

  constructor(nextHandler) {

    const filesUploader = multer({
      storage: getFileStorageUploader(destinationHandler, filenameHandler),
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



module.exports = NFTCollectionForm;