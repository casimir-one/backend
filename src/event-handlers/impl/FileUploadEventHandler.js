import { CONTRACT_AGREEMENT_STATUS } from '@deip/constants';

import BaseEventHandler from '../base/BaseEventHandler';
import APP_EVENT from '../../events/base/AppEvent';
import { ContractAgreementDtoService, PortalService, DraftService } from '../../services';
import FileStorage from '../../storage';
import cloneArchive from './../../dar/cloneArchive'
import writeArchive from './../../dar/writeArchive';
import { generatePdf } from '../../utils/pdf';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { PROJECT_CONTENT_DATA_TYPES } from '@deip/constants';

const getContractFilePath = async (filename) => {
  const contractAgreementDir = FileStorage.getContractAgreementDirPath();
  const isDirExists = await FileStorage.exists(contractAgreementDir);

  if (isDirExists) {
    const filePath = FileStorage.getContractAgreementFilePath(filename);
    const fileExists = await FileStorage.exists(filePath);

    if (fileExists) {
      await FileStorage.delete(filePath);
    }
  } else {
    await FileStorage.mkdir(contractAgreementDir);
  }

  return FileStorage.getContractAgreementFilePath(filename);
};

const saveContractPdf = async (content, filename) => {
  const filePath = await getContractFilePath(filename);
  const pdfBuffer = await generatePdf(content);

  await FileStorage.put(filePath, pdfBuffer);
};

class FileUploadEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }
}

const fileUploadEventHandler = new FileUploadEventHandler();
const contractAgreementDtoService = new ContractAgreementDtoService();
const portalService = new PortalService();
const draftService = new DraftService();

fileUploadEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED, async (event) => {
  const {
    terms,
    pdfContent
  } = event.getEventPayload();

  if (pdfContent && terms.filename) {
    await saveContractPdf(pdfContent, terms.filename);
  }
});

fileUploadEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_CREATED, async (event) => {
  const {
    entityId: contractAgreementId,
    terms,
    pdfContent
  } = event.getEventPayload();

  if (pdfContent && terms.filename) {
    const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);
    if (!contractAgreement || contractAgreement.status !== CONTRACT_AGREEMENT_STATUS.PROPOSED) {
      await saveContractPdf(pdfContent, terms.filename);
    }
  }
});

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

fileUploadEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED, async (event) => {

  const { projectId, draftId, draftType, ctx } = event.getEventPayload();

  const externalId = mongoose.Types.ObjectId(draftId);

  if (draftType == PROJECT_CONTENT_DATA_TYPES.DAR) { 
    const darPath = FileStorage.getResearchDarArchiveDirPath(projectId, externalId.toString());
    const blankDarPath = FileStorage.getResearchBlankDarArchiveDirPath();
    
    await cloneArchive(blankDarPath, darPath, true);
  }
  const files = ctx.req.files;
  if (draftType == PROJECT_CONTENT_DATA_TYPES.PACKAGE && files.length > 0) {
    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };
    const tempDestinationPath = files[0].destination;
    const hashObj = await FileStorage.calculateDirHash(tempDestinationPath, options);

    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");

    const projectContentPackageDirPath = FileStorage.getResearchContentPackageDirPath(projectId, packageHash);

    const projectContentPackageDirExists = await FileStorage.exists(projectContentPackageDirPath);

    if (projectContentPackageDirExists) {
      console.log(`Folder ${packageHash} already exists! Removing the uploaded files...`);
      await FileStorage.rmdir(tempDestinationPath);
      // draft already exist
      return
    }
    
    await FileStorage.rename(tempDestinationPath, projectContentPackageDirPath);
  }
});

fileUploadEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED, async (event) => {

  const { _id: draftId, xmlDraft } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId);

  const opts = {}
  const archiveDir = FileStorage.getResearchDarArchiveDirPath(draft.projectId, draft.folder);
  const version = await writeArchive(archiveDir, xmlDraft, {
    versioning: opts.versioning
  })
});

fileUploadEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_DELETED, async (event) => {
  const { draftId } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId)

  if (draft.type === PROJECT_CONTENT_DATA_TYPES.DAR) {
    const darPath = FileStorage.getResearchDarArchiveDirPath(draft.projectId, draft.folder);
    await FileStorage.rmdir(darPath);
  } else if (draft.type === PROJECT_CONTENT_DATA_TYPES.PACKAGE) {
    const packagePath = FileStorage.getResearchContentPackageDirPath(draft.projectId, draft.hash);
    await FileStorage.rmdir(packagePath);
  }
});

export default fileUploadEventHandler;
