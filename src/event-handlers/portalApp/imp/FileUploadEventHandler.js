
import { APP_EVENT, NFT_ITEM_METADATA_FORMAT } from '@casimir/platform-core';
import mongoose from 'mongoose';
import { NFTItemMetadataDraftService, PortalService } from '../../../services';
import FileStorage from '../../../storage';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

class FileUploadEventHandler extends PortalAppEventHandler {
  constructor() {
    super();
  }
}

const fileUploadEventHandler = new FileUploadEventHandler();
const portalService = new PortalService();
const nftItemMetadataDraftService = new NFTItemMetadataDraftService();

fileUploadEventHandler.register(APP_EVENT.PORTAL_SETTINGS_UPDATED, async (event) => {
  const { banner, logo, portalId } = event.getEventPayload();

  const portal = await portalService.getPortal(portalId);
  const oldBanner = portal.banner;
  const oldLogo = portal.logo;

  if (banner && oldBanner != banner) {
    const oldFilepath = FileStorage.getPortalBannerFilePath(portalId, oldBanner);
    const exists = await FileStorage.exists(oldFilepath);
    if (exists) {
      await FileStorage.delete(oldFilepath);
    }
  }

  if (logo && oldLogo != logo) {
    const oldFilepath = FileStorage.getPortalLogoFilePath(portalId, oldLogo);
    const exists = await FileStorage.exists(oldFilepath);
    if (exists) {
      await FileStorage.delete(oldFilepath);
    }
  }
});

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED, async (event) => {

  const { nftCollectionId, entityId, formatType, uploadedFiles } = event.getEventPayload();

  // temp solution

  // if (formatType === NFT_ITEM_METADATA_FORMAT.PACKAGE && uploadedFiles.length > 0) {
  //   const _id = mongoose.Types.ObjectId(entityId);
  //   const tempDestinationPath = uploadedFiles[0].destination;
  //   const nftItemMetadataDirPath = FileStorage.getNFTItemMetadataDirPath(nftCollectionId, _id);

  //   await FileStorage.rename(tempDestinationPath, nftItemMetadataDirPath);
  // }
});

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, async (event) => {

  const { _id: draftId, uploadedFiles } = event.getEventPayload();

  // temp solution
  
  // const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(draftId);

  // if (draft.formatType === NFT_ITEM_METADATA_FORMAT.PACKAGE) {
  //   const filesPathToDelete = draft.packageFiles
  //     .filter(({ filename }) => !uploadedFiles.some(({ originalname }) => originalname === filename))
  //     .map(({ filename }) => FileStorage.getNFTItemMetadataFilePath(draft.nftCollectionId, draft.folder, filename));

  //   await Promise.all(filesPathToDelete.map(filePath => FileStorage.delete(filePath)));
  // }
});

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, async (event) => {
  const { _id } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(_id)

  if (draft.type === NFT_ITEM_METADATA_FORMAT.PACKAGE) {
    const packagePath = FileStorage.getNFTItemMetadataDirPath(draft.nftCollectionId, draft.hash);
    await FileStorage.rmdir(packagePath);
  }
});

export default fileUploadEventHandler;
