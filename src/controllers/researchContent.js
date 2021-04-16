import path from 'path'
import util from 'util';
import request from 'request';
import parseFormdata from 'parse-formdata'
import readArchive from './../dar/readArchive'
import writeArchive from './../dar/writeArchive'
import cloneArchive from './../dar/cloneArchive'
import xml2js from 'xml2js';
import { v4 as uuidv4 } from 'uuid';
import config from './../config';
import ResearchContentPackageForm from './../forms/researchContentPackage';
import FileStorage from './../storage';
import crypto from 'crypto';
import slug from 'limax';
import * as blockchainService from './../utils/blockchain';
import ResearchGroupService from './../services/researchGroup';
import ResearchContentService from './../services/researchContent'
import ResearchService from './../services/research';
import { RESEARCH_CONTENT_STATUS, APP_EVENTS } from './../constants';
import ResearchContentCreatedEvent from './../events/legacy/researchContentCreatedEvent';
import ResearchContentProposedEvent from './../events/legacy/researchContentProposedEvent';
import ResearchContentProposalSignedEvent from './../events/legacy/researchContentProposalSignedEvent';


// ############ Read actions ############

const getResearchContent = async (ctx) => {
  const researchContentExternalId = ctx.params.researchContentExternalId;

  try {
    const researchContentService = new ResearchContentService();
    const researchContent = await researchContentService.getResearchContent(researchContentExternalId);
    if (!researchContent) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.status = 200;
    ctx.body = researchContent;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getResearchContentAndDraftsByResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;

  try {
    const researchContentService = new ResearchContentService()
    const researchService = new ResearchService();
    const research = await researchService.getResearch(researchExternalId);
    if (!research) {
      ctx.status = 404;
      ctx.body = `${researchExternalId} research is not found`;
      return;
    }

    const researchContents = await researchContentService.getResearchContentsByResearch(researchExternalId)
    const published = await researchContentService.findPublishedResearchContentRefsByResearch(researchExternalId)
    const drafts = await researchContentService.findDraftResearchContentRefsByResearch(researchExternalId);

    const result = [
      ...published.map((ref) => {
        const researchContent = researchContents.find(researchContent => ref._id.toString() == researchContent.external_id);
        return { ...researchContent, isDraft: false };
      }),
      ...drafts.map((ref) => {
        return { researchContentRef: ref, isDraft: true };
      })
    ];

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchContentsByTenant = async (ctx) => {
  const tenantId = ctx.params.tenantId;
  try {
    const researchContentService = new ResearchContentService()
    const result = await researchContentService.getResearchContentsByTenant(tenantId)
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getPublicResearchContentListing = async (ctx) => {
  try {
    const researchContentService = new ResearchContentService();
    const researchService = new ResearchService();
    const researchContents = await researchContentService.lookupResearchContents();
    const researchExternalIds = researchContents.reduce((acc, researchContent) => {
      if (!acc.some(researchExternalId => researchExternalId == researchContent.research_external_id)) {
        acc.push(researchContent.research_external_id);
      }
      return acc;
    }, []);

    const researches = await researchService.getResearches(researchExternalIds);
    const publicResearchesIds = researches.filter(r => !r.isPrivate).map(r => r.external_id);
    const result = researchContents.filter(researchContent => publicResearchesIds.some(id => id == researchContent.research_external_id))

    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const readResearchContentDarArchive = async (ctx) => {
  const darId = ctx.params.researchContentExternalId;
  const authorization = ctx.request.header['authorization'];
  const jwt = authorization.substring(authorization.indexOf("Bearer ") + "Bearer ".length, authorization.length);

  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.getResearchContentRef(darId);
    if (!rc) {
      ctx.status = 404;
      ctx.body = `Dar for "${darId}" id is not found`;
      return;
    }

    const archiveDir = FileStorage.getResearchDarArchiveDirPath(rc.researchExternalId, rc.folder);
    const exists = await FileStorage.exists(archiveDir);
    if (!exists) {
      ctx.status = 404;
      ctx.body = `Dar "${archiveDir}" is not found`;
      return;
    }

    const opts = {}
    const rawArchive = await readArchive(archiveDir, {
      noBinaryContent: true,
      ignoreDotFiles: true,
      versioning: opts.versioning
    })
    Object.keys(rawArchive.resources).forEach(recordPath => {
      const record = rawArchive.resources[recordPath]
      if (record._binary) {
        delete record._binary
        record.encoding = 'url'
        record.data = `${config.DEIP_SERVER_URL}/api/research-content/texture/${darId}/assets/${record.path}?authorization=${jwt}`;
      }
    })
    ctx.status = 200;
    ctx.body = rawArchive;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const readResearchContentDarArchiveStaticFiles = async (ctx) => {
  const darId = ctx.params.researchContentExternalId;
  const filename = ctx.params.file;

  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.getResearchContentRef(darId);
    const filepath = FileStorage.getResearchDarArchiveFilePath(rc.researchExternalId, rc.folder, filename);

    const buff = await FileStorage.get(filepath);
    const ext = filename.substr(filename.lastIndexOf('.') + 1);
    const name = filename.substr(0, filename.lastIndexOf('.'));
    const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
    const isPdf = ['pdf'].some(e => e == ext);

    if (isImage) {
      ctx.response.set('Content-Type', `image/${ext}`);
      ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
      ctx.body = buff;
    } else if (isPdf) {
      ctx.response.set('Content-Type', `application/${ext}`);
      ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
      ctx.body = buff;
    } else {
      ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
      ctx.body = buff;
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getResearchContentRef = async (ctx) => {
  const refId = ctx.params.refId;
  try {
    const researchContentService = new ResearchContentService();
    const ref = await researchContentService.getResearchContentRef(refId);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err;
  }
}

const getResearchContentReferencesGraph = async (ctx) => {
  const contentId = ctx.params.contentId;

  try {
    const researchContentService = new ResearchContentService();
    const graph = await researchContentService.getResearchContentReferencesGraph(contentId);
    ctx.status = 200;
    ctx.body = graph;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err;
  }
}

// ############ Write actions ############

const updateResearchContentDarArchive = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const darId = ctx.params.researchContentExternalId;

  try {

    const formValidation = () => new Promise(resolve => {
      parseFormdata(ctx.req, (err, formData) => {
        if (err) {
          resolve({ isSuccess: false, err: err })
        } else {
          resolve({ isSuccess: true, formData: formData })
        }
      })
    });

    const researchGroupService = new ResearchGroupService();
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.getResearchContentRef(darId);
    if (!rc || rc.status != RESEARCH_CONTENT_STATUS.IN_PROGRESS) {
      ctx.status = 405;
      ctx.body = `Research "${darId}" is locked for updates or does not exist`;
      return;
    }

    const authorized = await researchGroupService.authorizeResearchGroupAccount(rc.researchGroupExternalId, jwtUsername)
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${rc.researchId}" research`;
      return;
    }

    const result = await formValidation();
    if (!result.isSuccess) {
      ctx.status = 400;
      ctx.body = result.err.message;
      return;
    }

    const proposal = await researchContentService.lookupContentProposal(rc.researchGroupExternalId, rc.hash)
    if (proposal && researchContentService.proposalIsNotExpired(proposal)) {
      ctx.status = 405;
      ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be modified`
      return;
    }

    const archiveDir = FileStorage.getResearchDarArchiveDirPath(rc.researchExternalId, rc.folder);
    const exists = await FileStorage.exists(archiveDir);
    if (!exists) {
      ctx.status = 404;
      ctx.body = `Dar "${archiveDir}" is not found`;
      return;
    }

    const archive = JSON.parse(result.formData.fields._archive)

    result.formData.parts.forEach((part) => {
      const filename = part.filename
      const record = archive.resources[filename]
      if (!record) {
        console.error('No document record registered for blob', filename)
      } else {
        // TODO: make sure that this works in different browsers
        record.data = part.stream
      }
    })

    const opts = {}
    const version = await writeArchive(archiveDir, archive, {
      versioning: opts.versioning
    })

    await updateDraftMetaAsync(darId, archive);
    ctx.status = 200;
    ctx.body = version;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const unlockResearchContentDraft = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.getResearchContentRef(refId);
    if (!rc || (rc.status != RESEARCH_CONTENT_STATUS.PROPOSED && rc.status != RESEARCH_CONTENT_STATUS.PUBLISHED)) {
      ctx.status = 405;
      ctx.body = `Proposed "${refId}" content archive is not found`;
      return;
    }

    const authorized = await authService.authorizeResearchGroupAccount(rc.researchGroupExternalId, jwtUsername)
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${rc.researchId}" research`;
      return;
    }

    // if there is a proposal for this content (no matter it is approved or still in voting progress)
    // we must respond with an error as blockchain hashed data should not be modified
    const proposal = await researchContentService.lookupContentProposal(rc.researchGroupExternalId, rc.hash)
    if (proposal && researchContentService.proposalIsNotExpired(proposal)) {
      ctx.status = 405;
      ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be modified`;
      return;
    }

    const updatedRc = await researchContentService.updateResearchContentRef(rc._id, {
      status: RESEARCH_CONTENT_STATUS.IN_PROGRESS
    });

    ctx.status = 200;
    ctx.body = updatedRc;
  } catch (err) {
    console.log(err)
    ctx.status = 500;
    ctx.body = err;
  }
}

const createResearchContentDarArchive = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;

  try {

    const researchGroupService = new ResearchGroupService();
    const researchContentService = new ResearchContentService();
    const researchService = new ResearchService();

    const research = await researchService.getResearch(researchExternalId);
    const researchGroup = await researchGroupService.getResearchGroup(research.research_group.external_id);

    const externalId = `draft-${researchExternalId}-${uuidv4()}`;
    const darPath = FileStorage.getResearchDarArchiveDirPath(researchExternalId, externalId);
    const blankDarPath = FileStorage.getResearchBlankDarArchiveDirPath();
    
    await cloneArchive(blankDarPath, darPath, true);

    const folder = externalId;
    const researchContentRef = await researchContentService.createResearchContentRef({
      externalId,
      researchExternalId,
      researchGroupExternalId: researchGroup.external_id,
      folder: folder,
      researchId: research.id, // legacy internal id
      title: folder,
      hash: "",
      algo: "",
      type: "dar",
      status: RESEARCH_CONTENT_STATUS.IN_PROGRESS,
      packageFiles: [],
      authors: [],
      references: [],
      foreignReferences: []
    });

    ctx.status = 200;
    ctx.body = researchContentRef;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const deleteResearchContentDraft = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  try {

    const researchGroupService = new ResearchGroupService();
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.getResearchContentRef(refId);
    if (!rc) {
      ctx.status = 404;
      ctx.body = `Dar for "${refId}" id is not found`;
      return;
    }

    const authorized = await researchGroupService.authorizeResearchGroupAccount(rc.researchGroupExternalId, jwtUsername)
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
      return;
    }

    // if there is a proposal for this content (no matter is it approved or still in voting progress)
    // we must respond with an error as blockchain hashed data should not be modified
    const proposal = await researchContentService.lookupContentProposal(rc.researchGroupExternalId, rc.hash)
    if (proposal && researchContentService.proposalIsNotExpired(proposal)) {
      ctx.status = 405;
      ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be deleted`;
      return;
    }

    if (rc.type === 'dar') {
      const darPath = FileStorage.getResearchDarArchiveDirPath(rc.researchExternalId, rc.folder);
      await FileStorage.rmdir(darPath);
    } else if (rc.type === 'package') {
      const packagePath = FileStorage.getResearchContentPackageDirPath(rc.researchExternalId, rc.hash);
      await FileStorage.rmdir(packagePath);
    }

    await researchContentService.removeResearchContentRefById(refId);
    ctx.status = 201;
    ctx.body = "";

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

// DEPRECATED
const updateDraftMetaAsync = async (researchContentId, archive) => {

  const researchGroupService = new ResearchGroupService();
  const researchContentService = new ResearchContentService();

  const parseDraftMetaAsync = () => new Promise(resolve => {
    xml2js.parseString(archive.resources['manuscript.xml'].data, (err, result) => {
      if (err) {
        resolve(null)
        return;
      }
      let title = "";
      let authors = [];
      let references = [];

      try {
        title = result['article']['front'][0]['article-meta'][0]['title-group'][0]['article-title'][0];
      } catch (err) { }
      try {
        authors = result['article']['front'][0]['article-meta'][0]['contrib-group'][0]['contrib']
          .filter(p => p['string-name']).map(p => p['string-name'][0]['_'])
          .filter(username => username != null && username != '');
      } catch (err) { }

      resolve({ title, authors, references });
    })
  })

  const { title, authors, references } = await parseDraftMetaAsync();
  const rc = await researchContentService.getResearchContentRef(researchContentId);

  const accounts = [];
  for (let i = 0; i < authors.length; i++) {
    const username = authors[i];
    const hasRgt = await researchGroupService.authorizeResearchGroupAccount(rc.researchGroupExternalId, username)
    if (hasRgt) {
      accounts.push(username)
    }
  }

  const contentRefs = [];
  const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };

  const archiveDir = FileStorage.getResearchDarArchiveDirPath(rc.researchExternalId, rc.folder);
  const hashObj = await FileStorage.calculateDirHash(archiveDir, options);
  console.log(hashObj);
  const hashes = hashObj.children.map(f => f.hash);
  hashes.sort();

  const hash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");
  await researchContentService.updateResearchContentRef(rc._id, {
    title: title || '',
    authors: accounts,
    references: contentRefs,
    hash: hash,
    algo: "sha256",
    packageFiles: hashObj.children.map((f) => {
      return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
    })
  });
}


const uploadResearchContentPackage = async (ctx) => {

  try {

    const researchGroupService = new ResearchGroupService();
    const researchContentService = new ResearchContentService();
    const researchService = new ResearchService();

    const { researchExternalId, title, authors, references, tempDestinationPath } = await ResearchContentPackageForm(ctx);

    const research = await researchService.getResearch(researchExternalId);
    const researchGroup = await researchGroupService.getResearchGroup(research.research_group.external_id)

    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };
    const hashObj = await FileStorage.calculateDirHash(tempDestinationPath, options);
    console.log(hashObj);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");

    const researchContentRef = await researchContentService.findResearchContentRefByHash(researchExternalId, packageHash);
    const researchContentPackageDirPath = FileStorage.getResearchContentPackageDirPath(researchExternalId, packageHash);
    const researchContentPackageDirExists = await FileStorage.exists(researchContentPackageDirPath);
    
    if (researchContentPackageDirExists) {
      console.log(`Folder ${packageHash} already exists! Removing the uploaded files...`);
      await FileStorage.delete(tempDestinationPath);
      ctx.status = 200;
      ctx.body = researchContentRef;

    } else {

      await FileStorage.rename(tempDestinationPath, researchContentPackageDirPath);

      if (researchContentRef) {
        const updatedResearchContentRef = await researchContentService.updateResearchContentRef(researchContentRef._id, {
          folder: packageHash
        });

        ctx.status = 200;
        ctx.body = updatedResearchContentRef;
        
      } else {

        const draftId = `draft-${researchExternalId}-${packageHash}`;
        const draft = await researchContentService.createResearchContentRef({
          externalId: draftId,
          researchExternalId: researchExternalId,
          researchGroupExternalId: researchGroup.external_id,
          folder: packageHash,
          researchId: research.id, // legacy internal id
          title: title,
          hash: packageHash,
          algo: "sha256",
          type: "package",
          status: RESEARCH_CONTENT_STATUS.IN_PROGRESS,
          packageFiles: hashObj.children.map((f) => {
            return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
          }),
          authors: authors,
          references: references,
          foreignReferences: []
        });

        ctx.status = 200;
        ctx.body = draft;
      }
    }

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getResearchContentPackageFile = async function (ctx) {
  const researchContentExternalId = ctx.params.researchContentExternalId;
  const fileHash = ctx.params.fileHash;
  const isDownload = ctx.query.download === 'true';

  const researchContentService = new ResearchContentService();
  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService();

  const researchContentRef = await researchContentService.getResearchContentRef(researchContentExternalId);
  if (!researchContentRef) {
    ctx.status = 404;
    ctx.body = `Package "${researchContentExternalId}" is not found`
    return;
  }

  const research = await researchService.getResearch(researchContentRef.researchExternalId);
  if (research.isPrivate) {
    const jwtUsername = ctx.state.user.username;
    const authorizedGroup = await researchGroupService.authorizeResearchGroupAccount(research.research_group.external_id, jwtUsername)
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to get "${research.external_id}" research content`;
      return;
    }
  }

  const file = researchContentRef.packageFiles.find(f => f.hash == fileHash);
  if (!file) {
    ctx.status = 404;
    ctx.body = `File "${fileHash}" is not found`
    return;
  }

  const filename = file.filename;
  const filepath = FileStorage.getResearchContentPackageFilePath(researchContentRef.researchExternalId, researchContentRef.hash, filename);
  const ext = filename.substr(filename.lastIndexOf('.') + 1);
  const name = filename.substr(0, filename.lastIndexOf('.'));
  const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
  const isPdf = ['pdf'].some(e => e == ext);

  if (isDownload) {
    ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
  } else if (isImage) {
    ctx.response.set('content-type', `image/${ext}`);
    ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
  } else if (isPdf) {
    ctx.response.set('content-type', `application/${ext}`);
    ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
  } else {
    ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
  }

  const fileExists = await FileStorage.exists(filepath);
  if (!fileExists) {
    ctx.status = 404;
    ctx.body = `${filepath} is not found`;
    return;
  }

  const buff = await FileStorage.get(filepath);
  ctx.body = buff;
}


const createResearchContent = async (ctx, next) => {
  const { tx, offchainMeta, isProposal } = ctx.request.body;

  try {
    const researchContentService = new ResearchContentService();
    const datums = blockchainService.extractOperations(tx);

    const [opName, opPayload] = datums.find(([opName,]) => opName == 'create_research_content');
    const { content: hash, external_id: researchContentExternalId, research_external_id: researchExternalId, authors } = opPayload;
    
    const rc = await researchContentService.findResearchContentRefByHash(researchExternalId, hash);
    const draft = rc ? rc : null;
    
    if (!draft) {
      ctx.status = 400;
      ctx.body = `Research content draft with hash "${hash}" does not exist`;
      return;
    }

    if (draft.status != RESEARCH_CONTENT_STATUS.IN_PROGRESS) {
      ctx.status = 409;
      ctx.body = `Research content "${researchContentExternalId}" is in '${draft.status}' status`
      return;
    }
    
    const txResult = await blockchainService.sendTransactionAsync(tx);
    
    const draftPath = draft.type == 'package' 
      ? FileStorage.getResearchContentPackageDirPath(researchExternalId, draft.folder)
      : /* 'dar' */ FileStorage.getResearchDarArchiveDirPath(researchExternalId, draft.folder);

    const publishedContentPath = draft.type == 'package' 
      ? FileStorage.getResearchContentPackageDirPath(researchExternalId, hash)
      : /* 'dar' */ FileStorage.getResearchDarArchiveDirPath(researchExternalId, hash);

    if (draftPath != publishedContentPath) {
      await FileStorage.rename(draftPath, publishedContentPath)
    }

    // remove draft
    await researchContentService.removeResearchContentRefByHash(researchExternalId, hash);

    offchainMeta.researchContent.folder = hash;
    offchainMeta.researchContent.packageFiles = draft.packageFiles;
    offchainMeta.researchContent.algo = draft.algo;
    offchainMeta.researchContent.type = draft.type;
    offchainMeta.researchContent.foreignReferences = draft.foreignReferences;

    let entityExternalId;
    if (isProposal) {
      const researchContentProposedEvent = new ResearchContentProposedEvent(datums, offchainMeta.researchContent);
      ctx.state.events.push(researchContentProposedEvent);

      const researchContentApprovals = researchContentProposedEvent.getProposalApprovals();
      for (let i = 0; i < researchContentApprovals.length; i++) {
        const approval = researchContentApprovals[i];
        const researchContentProposalSignedEvent = new ResearchContentProposalSignedEvent([approval]);
        ctx.state.events.push(researchContentProposalSignedEvent);
      }

      const { researchContentExternalId } = researchContentProposedEvent.getSourceData();
      entityExternalId = researchContentExternalId;

    } else {
      const researchContentCreatedEvent = new ResearchContentCreatedEvent(datums, offchainMeta.researchContent);
      ctx.state.events.push(researchContentCreatedEvent);

      const { researchContentExternalId } = researchContentCreatedEvent.getSourceData();
      entityExternalId = researchContentExternalId;
    }

    ctx.status = 200;
    ctx.body = { external_id: researchContentExternalId };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


export default {
  // dar
  readResearchContentDarArchive,
  readResearchContentDarArchiveStaticFiles,
  createResearchContentDarArchive,
  updateResearchContentDarArchive,

  // files
  uploadResearchContentPackage,
  getResearchContentPackageFile,

  // refs
  getResearchContentRef,

  getResearchContentReferencesGraph,

  getResearchContent,
  getPublicResearchContentListing,
  getResearchContentsByTenant,

  getResearchContentAndDraftsByResearch,
  // drafts
  deleteResearchContentDraft,
  unlockResearchContentDraft,

  createResearchContent
}