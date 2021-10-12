import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import {
  ProjectDtoService,
  ProjectContentService,
  DraftService
} from './../../services';
import cloneArchive from './../../dar/cloneArchive'
import writeArchive from './../../dar/writeArchive';
import FileStorage from './../../storage';
import { PROJECT_CONTENT_STATUS } from './../../constants';
import mongoose from 'mongoose';
import crypto from 'crypto';
import path from 'path';

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
    type,
    authors,
    title,
    proposalCtx
  } = event.getEventPayload();

  await draftService.updateDraft({
    _id: draftId,
    authors,
    title,
    status: PROJECT_CONTENT_STATUS.PROPOSED
  })
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED, async (event) => {

  const { projectId, draftId, draftType, authors, references, title, ctx } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);

  const externalId = mongoose.Types.ObjectId(draftId);

  const draftData = {
    externalId,
    projectId,
    teamId: project.research_group.external_id,
    hash: '',
    algo: '',
    folder: externalId,
    status: PROJECT_CONTENT_STATUS.IN_PROGRESS,
    authors: authors || [],
    references: references || [],
    packageFiles: [],
    foreignReferences: []
  }

  if (draftType == 'dar') { 
    const darPath = FileStorage.getResearchDarArchiveDirPath(projectId, externalId.toString());
    const blankDarPath = FileStorage.getResearchBlankDarArchiveDirPath();
    
    await cloneArchive(blankDarPath, darPath, true);

    draftData.title = title || externalId;
    draftData.type = draftType;
  }

  if (draftType == 'package' && ctx.req.files.length > 0) {
    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };
    const files = ctx.req.files;
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

      return
    }
    
    await FileStorage.rename(tempDestinationPath, projectContentPackageDirPath);
    draftData.title = title;
    draftData.hash = packageHash;
    draftData.algo = 'sha256';
    draftData.type = draftType;
    draftData.packageFiles = hashObj.children.map((f) => ({ filename: f.name, hash: f.hash, ext: path.extname(f.name) }));
    draftData.folder = packageHash;
  }
  
  const projectContentRef = await draftService.createDraft(draftData);
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED, async (event) => {

  const { _id: draftId, xmlDraft } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId);

  const opts = {}
  const archiveDir = FileStorage.getResearchDarArchiveDirPath(draft.projectId, draft.folder);
  const version = await writeArchive(archiveDir, xmlDraft, {
    versioning: opts.versioning
  })
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_DELETED, async (event) => {

  const { draftId } = event.getEventPayload();

  const draft = await draftService.getDraft(draftId)

  if (draft.type === 'dar') {
    const darPath = FileStorage.getResearchDarArchiveDirPath(draft.projectId, draft.folder);
    await FileStorage.rmdir(darPath);
  } else if (draft.type === 'package') {
    const packagePath = FileStorage.getResearchContentPackageDirPath(draft.projectId, draft.hash);
    await FileStorage.rmdir(packagePath);
  }

  await draftService.deleteDraft(draftId);
});

projectContentEventHandler.register(APP_EVENT.PROJECT_CONTENT_CREATED, async (event) => {

  const {
    projectId,
    teamId,
    type,
    description,
    content,
    authors,
    references,
    title,
    entityId
  } = event.getEventPayload();

    const draft = await draftService.getDraft(content)

    await draftService.deleteDraft(content);

    const projectContent = await projectContentService.createProjectContentRef({
      ...draft,
      externalId: entityId,
      projectId,
      teamId,
      title,
      status: PROJECT_CONTENT_STATUS.PUBLISHED,
      authors,
      references
    });
});


module.exports = projectContentEventHandler;