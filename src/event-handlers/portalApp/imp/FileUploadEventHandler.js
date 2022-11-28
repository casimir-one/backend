
import { APP_EVENT, NFT_ITEM_METADATA_FORMAT } from '@casimir.one/platform-core';
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

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, async (event) => {
  const { _id: draftId, uploadedFiles } = event.getEventPayload();
  console.log("APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED", event);

  const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(draftId);

  if (uploadedFiles && uploadedFiles.length) {
    const dirPath = FileStorage.getNFTItemMetadataDirPath(draft.nftCollectionId, draft.nftItemId);
    const dirHash = await FileStorage.calculateDirHash(dirPath);

    const dirFiles = dirHash.children.reduce((acc, elem) => {
      if (elem.children) {
        const files = elem.children.filter(f => !f.children).map(f => ({ folder: elem.name, name: f.name }));
        return [...acc, ...files];
      }
      return acc;
    }, []);

    const filesPathToDelete = dirFiles
      .filter(({ name }) => !uploadedFiles.some(( { filename }) => filename === name))
      .map(({ name, folder }) => FileStorage.getNFTItemMetadataAttributeFilePath(draft.nftCollectionId, draft.nftItemId, folder, name));

    await Promise.all(filesPathToDelete.map(filePath => FileStorage.delete(filePath)));
  }
});

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, async (event) => {
    console.log("APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED", event);
  const { _id } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(_id)

  if (draft.type === NFT_ITEM_METADATA_FORMAT.PACKAGE) {
    const packagePath = FileStorage.getNFTItemMetadataDirPath(draft.nftCollectionId, draft.nftItemId);
    await FileStorage.rmdir(packagePath);
  }
});

export default fileUploadEventHandler;
