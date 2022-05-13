import { APP_EVENT, PROJECT_CONTENT_FORMAT, PROJECT_CONTENT_STATUS, PROJECT_CONTENT_TYPES } from '@deip/constants';
import { genSha256Hash } from '@deip/toolbox';
import mongoose from 'mongoose';
import path from 'path';
import {
  DraftService, ProjectContentService, ProjectDtoService
} from '../../../services';
import FileStorage from '../../../storage';
import BaseEventHandler from '../../base/BaseEventHandler';

const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };

class ProjectContentEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const projectContentEventHandler = new ProjectContentEventHandler();

const projectDtoService = new ProjectDtoService();
const projectContentService = new ProjectContentService();
const draftService = new DraftService();

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_PROPOSAL_CREATED, async (event) => {
  const {
    proposalId,
    expirationTime,
    entityId,
    projectId,
    teamId,
    content: draftId,
    contentType = PROJECT_CONTENT_TYPES.ANNOUNCEMENT,
    authors,
    title,
    proposalCtx
  } = event.getEventPayload();

  await draftService.updateDraft({
    _id: draftId,
    authors,
    title,
    contentType,
    status: PROJECT_CONTENT_STATUS.PROPOSED
  })
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED, async (event) => {

  const {
    projectId,
    draftId,
    contentType = PROJECT_CONTENT_TYPES.ANNOUNCEMENT,
    formatType,
    authors,
    references,
    title,
    jsonData,
    metadata
  } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);

  const _id = mongoose.Types.ObjectId(draftId);

  const draftData = {
    _id,
    title: title || _id,
    projectId,
    teamId: project.teamId,
    hash: '',
    algo: 'sha256',
    contentType,
    formatType,
    folder: _id,
    status: PROJECT_CONTENT_STATUS.IN_PROGRESS,
    authors: authors || [],
    references: references || [],
    packageFiles: [],
    foreignReferences: [],
    metadata
  }

  if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
    const packageHash = genSha256Hash(JSON.stringify(jsonData));
    draftData.jsonData = jsonData;
    draftData.hash = packageHash;
    draftData.packageFiles = [];
  } else {
    const projectContentPackageDirPath = FileStorage.getProjectContentPackageDirPath(projectId, _id);
    const hashObj = await FileStorage.calculateDirHash(projectContentPackageDirPath, options);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = genSha256Hash(hashes.join(","));
    draftData.hash = packageHash;
    draftData.packageFiles = hashObj.children.map((f) => ({ filename: f.name, hash: f.hash, ext: path.extname(f.name) }));
  }

  const projectContentRef = await draftService.createDraft(draftData);
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED, async (event) => {

  const {
    _id: draftId,
    authors,
    title,
    contentType = PROJECT_CONTENT_TYPES.ANNOUNCEMENT,
    formatType,
    references,
    status,
    jsonData,
    metadata,
    xmlDraft
  } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId);
  let packageHash = '';
  let packageFiles = [];
  if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
    packageHash = genSha256Hash(JSON.stringify(jsonData));
  } else if (draft.formatType === PROJECT_CONTENT_FORMAT.DAR || draft.formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const projectContentPackageDirPath = FileStorage.getProjectDarArchiveDirPath(draft.projectId, draftId);
    const hashObj = await FileStorage.calculateDirHash(projectContentPackageDirPath, options);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    packageHash = genSha256Hash(hashes.join(","));
    packageFiles = hashObj.children.map((f) => ({ filename: f.name, hash: f.hash, ext: path.extname(f.name) }));
  }

  await draftService.updateDraft({
    _id: draftId,
    authors,
    title,
    contentType,
    references,
    status,
    jsonData,
    metadata,
    hash: packageHash,
    packageFiles
  })
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_DELETED, async (event) => {
  const { draftId } = event.getEventPayload();

  await draftService.deleteDraft(draftId);
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_CREATED, async (event) => {

  const {
    projectId,
    teamId,
    contentType = PROJECT_CONTENT_TYPES.ANNOUNCEMENT,
    description,
    content,
    authors,
    references,
    title,
    entityId,
    metadata
  } = event.getEventPayload();

  const draft = await draftService.getDraftByHash(content)

  await draftService.deleteDraft(draft._id);

  const projectContent = await projectContentService.createProjectContentRef({
    ...draft,
    _id: entityId,
    projectId,
    teamId,
    title,
    contentType,
    authors,
    references,
    metadata: {
      ...draft.metadata,
      ...metadata
    }
  });
});


module.exports = projectContentEventHandler;