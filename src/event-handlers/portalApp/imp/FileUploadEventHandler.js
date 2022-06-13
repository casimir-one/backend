
import { APP_EVENT, PROJECT_CONTENT_FORMAT } from '@deip/constants';
import mongoose from 'mongoose';
import cloneArchive from '../../../dar/cloneArchive';
import writeArchive from '../../../dar/writeArchive';
import { NftItemMetadataDraftService, PortalService } from '../../../services';
import FileStorage from '../../../storage';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

class FileUploadEventHandler extends PortalAppEventHandler {
  constructor() {
    super();
  }
}

const fileUploadEventHandler = new FileUploadEventHandler();
const portalService = new PortalService();
const nftItemMetadataDraftService = new NftItemMetadataDraftService();

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

  if (formatType === PROJECT_CONTENT_FORMAT.DAR || formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const _id = mongoose.Types.ObjectId(entityId);

    if (formatType == PROJECT_CONTENT_FORMAT.DAR) {
      const darPath = FileStorage.getProjectDarArchiveDirPath(nftCollectionId, _id);
      const blankDarPath = FileStorage.getProjectBlankDarArchiveDirPath();

      await cloneArchive(blankDarPath, darPath, true);
    }
    if (formatType == PROJECT_CONTENT_FORMAT.PACKAGE && uploadedFiles.length > 0) {
      const tempDestinationPath = uploadedFiles[0].destination;

      const projectContentPackageDirPath = FileStorage.getProjectContentPackageDirPath(nftCollectionId, _id);

      await FileStorage.rename(tempDestinationPath, projectContentPackageDirPath);
    }
  }
});

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, async (event) => {

  const { _id: draftId, xmlDraft, uploadedFiles } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(draftId);

  if (draft.formatType === PROJECT_CONTENT_FORMAT.DAR) {
    const opts = {}
    const archiveDir = FileStorage.getProjectDarArchiveDirPath(draft.projectId, draft.folder);
    const version = await writeArchive(archiveDir, xmlDraft, {
      versioning: opts.versioning
    })
  }
  if (draft.formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const filesPathToDelete = draft.packageFiles
      .filter(({ filename }) => !uploadedFiles.some(({ originalname }) => originalname === filename))
      .map(({ filename }) => FileStorage.getProjectContentPackageFilePath(draft.projectId, draft.folder, filename));

    await Promise.all(filesPathToDelete.map(filePath => FileStorage.delete(filePath)));
  }
});

fileUploadEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, async (event) => {
  const { _id } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(_id)

  if (draft.type === PROJECT_CONTENT_FORMAT.DAR) {
    const darPath = FileStorage.getProjectDarArchiveDirPath(draft.projectId, draft.folder);
    await FileStorage.rmdir(darPath);
  } else if (draft.type === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const packagePath = FileStorage.getProjectContentPackageDirPath(draft.projectId, draft.hash);
    await FileStorage.rmdir(packagePath);
  }
});

export default fileUploadEventHandler;
