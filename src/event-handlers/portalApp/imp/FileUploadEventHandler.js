
import { APP_EVENT, NFT_ITEM_METADATA_FORMAT } from '@casimir.one/platform-core';
import { NFTItemService, PortalService } from '../../../services';
import FileStorage from '../../../storage';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

class FileUploadEventHandler extends PortalAppEventHandler {
  constructor() {
    super();
  }
}

const fileUploadEventHandler = new FileUploadEventHandler();

const portalService = new PortalService();
const nftItemService = new NFTItemService();

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

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_UPDATED, async (event) => {
  const { _id: nftItemId, uploadedFiles } = event.getEventPayload();
  const nftItem = await nftItemService.getNFTItem(nftItemId);

  if (uploadedFiles && uploadedFiles.length) {
    const dirPath = FileStorage.getNFTItemMetadataDirPath(nftItem.nftCollectionId, nftItem._id);
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
      .map((info) => {
        const { name, folder } = info;
        return FileStorage.getNFTItemMetadataAttributeFilePath(nftItem.nftCollectionId, nftItem._id, folder, name);
      });

    await Promise.all(filesPathToDelete.map(filePath => FileStorage.delete(filePath)));
  }
});

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_DELETED, async (event) => {
  const { _id } = event.getEventPayload();
  const nftItem = await nftItemService.getNFTItem(_id);
  if (nftItem.type === NFT_ITEM_METADATA_FORMAT.PACKAGE) {
    const packagePath = FileStorage.getNFTItemMetadataDirPath(nftItem.nftCollectionId, nftItem._id);
    await FileStorage.rmdir(packagePath);
  }
});

export default fileUploadEventHandler;
