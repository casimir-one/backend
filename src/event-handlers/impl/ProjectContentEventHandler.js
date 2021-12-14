import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import {
  ProjectDtoService,
  ProjectContentService,
  DraftService
} from './../../services';
import { genSha256Hash } from '@deip/toolbox';
import FileStorage from './../../storage';
import { PROJECT_CONTENT_STATUS, PROJECT_CONTENT_FORMAT } from '@deip/constants';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';

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
    contentType,
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

  const { projectId, draftId, contentType, formatType, authors, references, title, jsonData, ctx } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);

  const externalId = mongoose.Types.ObjectId(draftId);

  const draftData = {
    externalId,
    title: title || externalId,
    projectId,
    teamId: project.research_group.external_id,
    hash: '',
    algo: 'sha256',
    contentType,
    formatType,
    folder: externalId,
    status: PROJECT_CONTENT_STATUS.IN_PROGRESS,
    authors: authors || [],
    references: references || [],
    packageFiles: [],
    foreignReferences: []
  }

  if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
    const packageHash = genSha256Hash(JSON.stringify(jsonData));
    draftData.jsonData = jsonData;
    draftData.hash = packageHash;
    draftData.packageFiles = [];
  } else {
    const projectContentPackageDirPath = FileStorage.getResearchContentPackageDirPath(projectId, externalId);
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

  const { _id: draftId, authors, title, contentType, formatType, references, status, jsonData, xmlDraft } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId);
  let packageHash = '';
  let packageFiles = [];
  if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
    packageHash = genSha256Hash(JSON.stringify(jsonData));
  } else if (draft.formatType === PROJECT_CONTENT_FORMAT.DAR || draft.formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const projectContentPackageDirPath = FileStorage.getResearchDarArchiveDirPath(draft.projectId, draftId);
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
    contentType,
    description,
    content,
    authors,
    references,
    title,
    entityId
  } = event.getEventPayload();

    const draft = await draftService.getDraftByHash(content)

    await draftService.deleteDraft(draft._id);

    const projectContent = await projectContentService.createProjectContentRef({
      ...draft,
      externalId: entityId,
      projectId,
      teamId,
      title,
      contentType,
      authors,
      references
    });
});


module.exports = projectContentEventHandler;