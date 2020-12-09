import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import multer from 'koa-multer';
import parseFormdata from 'parse-formdata'
import readArchive from './../dar/readArchive'
import writeArchive from './../dar/writeArchive'
import cloneArchive from './../dar/cloneArchive'
import listArchives from './../dar/listArchives'
import deipRpc from '@deip/rpc-client';
import xml2js from 'xml2js';
import { hashElement } from 'folder-hash';
import config from './../config';
import { researchContentForm } from './../forms/researchContentForms';
import url from 'url';
import crypto from 'crypto';
import rimraf from "rimraf";
import slug from 'limax';
import * as blockchainService from './../utils/blockchain';
import * as authService from './../services/auth';
import ResearchContentService from './../services/researchContent';
import { RESEARCH_CONTENT_STATUS, APP_EVENTS } from './../constants';
import ResearchContentCreatedEvent from './../events/researchContentCreatedEvent';
import ResearchContentProposedEvent from './../events/researchContentProposedEvent';
import ResearchContentProposalSignedEvent from './../events/researchContentProposalSignedEvent';
import ResearchContentProposalRejectedEvent from './../events/researchContentProposalRejectedEvent';


const storagePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
const blankDarPath = path.join(__dirname, `./../default/dar-blank`);

const researchStoragePath = (researchId) => `${storagePath}/research-projects/${researchId}`
const researchFileStoragePath = (researchId) => `${storagePath}/research-projects/${researchId}`
const researchFilesTempStoragePath = (researchId, postfix) => `${researchFileStoragePath(researchId)}/temp-${postfix}`
const researchFilesPackagePath = (researchId, packageHash) => `${researchFileStoragePath(researchId)}/${packageHash}`
const researchFilesPackageFilePath = (researchId, packageHash, fileHash) => `${researchFilesPackagePath(researchId, packageHash)}/${fileHash}`
const researchFileContentPath = (researchId, filename) => `${researchFileStoragePath(researchId)}/${filename}`
const researchDarArchivePath = (researchId, archiveName) => `${researchFileStoragePath(researchId)}/${archiveName}`
const researchDarArchiveFilePath = (researchId, archiveName, filename) => `${researchDarArchivePath(researchId, archiveName)}/${filename}`


const opts = {}

// ############ Read actions ############

const listDarArchives = async (ctx) => {
  try {
    const records = await listArchives(storagePath)
    ctx.status = 200;
    ctx.body = records;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchContent = async (ctx) => {
  let researchContentExternalId = ctx.params.researchContentExternalId;

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
    ctx.body = err.message;
  }
}



const getResearchContents = async (ctx) => {
  const tenant = ctx.state.tenant;
  const query = qs.parse(ctx.query);
  const researchContentsExternalIds = query.researchContents;

  try {

    if (!Array.isArray(researchContentsExternalIds)) {
      ctx.status = 400;
      ctx.body = `Bad request (${JSON.stringify(query)})`;
      return;
    }

    const researchContentService = new ResearchContentService();
    const result = await researchContentService.getResearchContents(researchContentsExternalIds);

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


const getResearchContentByResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  const tenant = ctx.state.tenant;

  try {

    const researchContentService = new ResearchContentService()
    const research = await deipRpc.api.getResearchAsync(researchExternalId);
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
    ctx.body = err.message;
  }
}


const readDarArchive = async (ctx) => {
  const darId = ctx.params.dar;
  const authorization = ctx.request.header['authorization'];
  const jwt = authorization.substring(authorization.indexOf("Bearer ") + "Bearer ".length, authorization.length);

  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.findResearchContentRefById(darId);
    if (!rc) {
      ctx.status = 404;
      ctx.body = `Dar for "${darId}" id is not found`;
      return;
    }

    const archiveDir = researchDarArchivePath(rc.researchExternalId, rc.folder);
    const stat = util.promisify(fs.stat);
    const check = await stat(archiveDir);

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
        record.data = `${config['SERVER_HOST']}/content/${darId}/assets/${record.path}?authorization=${jwt}`;
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

const readDarArchiveStaticFiles = async (ctx) => {
  const darId = ctx.params.dar;
  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.findResearchContentRefById(darId);
    const archivePath = researchDarArchivePath(rc.researchExternalId, rc.folder);

    const stat = util.promisify(fs.stat);
    const check = await stat(archivePath);
    await send(ctx, researchDarArchiveFilePath(rc.researchExternalId, rc.folder, ctx.params.file), { root: '/' });
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getContentRef = async (ctx) => {
  const refId = ctx.params.refId;
  try {
    const researchContentService = new ResearchContentService();

    const ref = await researchContentService.findResearchContentRefById(refId);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getContentRefByHash = async (ctx) => {
  const hash = ctx.params.hash;
  const researchExternalId = ctx.params.researchExternalId;
  try {
    const researchContentService = new ResearchContentService();

    const ref = await researchContentService.findResearchContentRefByHash(researchExternalId, hash);
    ctx.status = 200;
    ctx.body = ref;
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

// ############ Write actions ############

const updateDarArchive = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const darId = ctx.params.dar;
  const formValidation = () => new Promise(resolve => {
    parseFormdata(ctx.req, (err, formData) => {
      if (err) {
        resolve({ isSuccess: false, err: err })
      } else {
        resolve({ isSuccess: true, formData: formData })
      }
    })
  });

  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.findResearchContentRefById(darId);
    if (!rc || rc.status != RESEARCH_CONTENT_STATUS.IN_PROGRESS) {
      ctx.status = 405;
      ctx.body = `Research "${darId}" is locked for updates or does not exist`;
      return;
    }
    const authorized = await authService.authorizeResearchGroupAccount(rc.researchGroupExternalId, jwtUsername)
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

    const archiveDir = researchDarArchivePath(rc.researchExternalId, rc.folder);
    const stat = util.promisify(fs.stat);
    const check = await stat(archiveDir);
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


const unlockContentDraft = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.findResearchContentRefById(refId);
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

    rc.status = RESEARCH_CONTENT_STATUS.IN_PROGRESS;
    const updatedRc = await rc.save();
    ctx.status = 200;
    ctx.body = updatedRc;
  } catch (err) {
    console.log(err)
    ctx.status = 500;
    ctx.body = err.message;
  }
}

// const clone = async (ctx) => {
//     const originalPath = path.join(storagePath, ctx.params.dar);
//     const newPath = path.join(storagePath, ctx.params.newdar);
//     try {
//         await cloneArchive(originalPath, newPath);
//         ctx.status = 200;
//         ctx.body = { status: 'ok' };
//     } catch (err) {
//         console.log(err);
//         ctx.status = 500;
//         ctx.body = err.message;
//     }
// }

const createDarArchive = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchExternalId = ctx.params.researchExternalId;

  if (!researchExternalId) {
    ctx.status = 400;
    ctx.body = `"${researchExternalId}" is invalid research id`;
    return;
  }

  try {
    const researchContentService = new ResearchContentService();
    const research = await deipRpc.api.getResearchAsync(researchExternalId);
    const researchInternalId = research.id;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(research.research_group.external_id, jwtUsername);
    const researchGroupExternalId = authorizedGroup.external_id;

    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${researchGroupExternalId}" research`;
      return;
    }

    const now = new Date().getTime();
    const externalId = `draft-${researchExternalId}-${now}`;
    const darPath = researchDarArchivePath(researchExternalId, externalId);
    await cloneArchive(blankDarPath, darPath);

    const folder = externalId;
    const researchContentRm = await researchContentService.createResearchContentRef({
      externalId,
      researchExternalId,
      researchGroupExternalId,
      folder: folder,
      researchId: researchInternalId, // legacy internal id
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
    ctx.body = {
      draft: researchContentRm
    };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const deleteContentDraft = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  try {
    const researchContentService = new ResearchContentService();

    const rc = await researchContentService.findResearchContentRefById(refId);
    if (!rc) {
      ctx.status = 404;
      ctx.body = `Dar for "${refId}" id is not found`;
      return;
    }

    const authorized = await authService.authorizeResearchGroupAccount(rc.researchGroupExternalId, jwtUsername)
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

    const unlink = util.promisify(fs.unlink);

    if (rc.type === 'dar') {
      await fsExtra.remove(path.join(storagePath, rc.folder));
    } else if (rc.type === 'file') {
      await unlink(researchFileContentPath(rc.researchExternalId, rc.folder));
    } else if (rc.type === 'package') {
      await fsExtra.remove(researchFilesPackagePath(rc.researchExternalId, rc.hash));
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

const updateDraftMetaAsync = async (researchContentId, archive) => {
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
      try {
        references = parseInternalReferences(result['article']['back'][0]['ref-list'][0]['ref']);
      } catch (err) { }

      resolve({ title, authors, references });
    })
  })

  const { title, authors, references } = await parseDraftMetaAsync();
  const rc = await researchContentService.findResearchContentRefById(researchContentId);

  const accounts = [];
  for (let i = 0; i < authors.length; i++) {
    const username = authors[i];
    const hasRgt = await authService.authorizeResearchGroupAccount(rc.researchGroupExternalId, username)
    if (hasRgt) {
      accounts.push(username)
    }
  }

  const contentRefs = [];
  for (let i = 0; i < references.length; i++) {
    const ref = references[i];
    const content = await deipRpc.api.getResearchContentByAbsolutePermlinkAsync(ref.researchGroupPermlink, ref.researchPermlink, ref.researchContentPermlink);
    const researchContent = await researchContentService.getResearchContent(content.external_id);

    if (researchContent.research_external_id != rc.researchExternalId) {
      // exclude references to the same research
      contentRefs.push(researchContent.external_id);
    }
  }

  rc.title = title || '';
  rc.authors = accounts;
  rc.references = contentRefs;

  const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };

  const archiveDir = researchDarArchivePath(rc.researchExternalId, rc.folder);
  const hashObj = await hashElement(archiveDir, options);
  console.log(hashObj);
  const hashes = hashObj.children.map(f => f.hash);
  hashes.sort();
  const hash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");
  rc.hash = hash;
  rc.algo = "sha256";
  rc.packageFiles = hashObj.children.map((f) => {
    return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
  });
  await rc.save()
}

const parseInternalReferences = (refList) => {
  return [];
  const webpageRefs = refList.filter(ref => {
    try {
      return ref['element-citation'][0]['$']['publication-type'] === 'webpage';
    } catch (err) {
      return false;
    }
  }).map(ref => {
    return ref['element-citation'][0];
  });
  const deipRefs = webpageRefs
    .filter(wref => wref.uri && wref.uri[0])
    .map(wref => {
      try {
        const parsedUrl = url.parse(wref.uri[0]);
        if (parsedUrl.href.indexOf(config.CLIENT_URL) === 0) {
          const segments = parsedUrl.hash.split('/');
          const researchGroupPermlink = decodeURIComponent(segments[1]);
          const researchPermlink = decodeURIComponent(segments[3]);
          const researchContentPermlink = decodeURIComponent(segments[4]);
          return { researchGroupPermlink, researchPermlink, researchContentPermlink };
        }
      } catch (err) {
        console.log(err);
      }
      return null;
    })
    .filter(r => r != null);

  return deipRefs;
};

// ############# files ######################

const uploadBulkResearchContent = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchExternalId = ctx.request.header['research-external-id'];
  const referencesStr = ctx.request.header['research-content-references'];
  const uploadSession = ctx.request.header['upload-session'];

  try {
    const researchContentService = new ResearchContentService();

    if (!researchExternalId) {
      ctx.status = 400;
      ctx.body = { error: `"research-external-id" header is required` };
      return;
    }

    const stat = util.promisify(fs.stat);
    const ensureDir = util.promisify(fsExtra.ensureDir);

    const research = await deipRpc.api.getResearchAsync(researchExternalId);
    const researchInternalId = research.id;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(research.research_group.external_id, jwtUsername)
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to edit "${researchExternalId}" research`;
      return;
    }

    const researchGroupInternalId = authorizedGroup.id;
    const researchGroupExternalId = authorizedGroup.external_id;

    const researchFilesTempStorage = researchFilesTempStoragePath(researchExternalId, uploadSession)
    await ensureDir(researchFilesTempStorage);

    const researchContent = researchContentForm.any();
    const tempDestinationPath = await researchContent(ctx, () => new Promise((resolve, reject) => {
      if (!ctx.req.files[0] || !ctx.req.files[0].destination) {
        reject(new Error(`No destination path found during bulk-uploading`))
        return;
      }
      fs.stat(ctx.req.files[0].destination, (err, stats) => {
        if (err || !stats.isDirectory()) {
          console.error(err);
          reject(err)
        }
        else {
          resolve(ctx.req.files[0].destination);
        }
      });
    }));

    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };
    const hashObj = await hashElement(tempDestinationPath, options);
    console.log(hashObj);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = crypto.createHash('sha256').update(hashes.join(",")).digest("hex");

    var exists = false;
    const rc = await researchContentService.findResearchContentRefByHash(researchExternalId, packageHash);
    const packagePath = researchFilesPackagePath(researchExternalId, packageHash);

    if (rc) {
      try {
        const check = await stat(packagePath);
        exists = true;
      } catch (err) {
        exists = false;
      }
    }

    if (exists) {

      console.log(`Folder ${packageHash} already exists! Removing the uploaded files...`);
      rimraf(tempDestinationPath, function () { console.log(`${tempDestinationPath} removed`); });
      ctx.status = 200;
      ctx.body = { rm: rc };

    } else {

      await fsExtra.move(tempDestinationPath, packagePath, { overwrite: true });

      if (rc) {
        rc.folder = packageHash;
        const updatedRc = await rc.save();
        ctx.status = 200;
        ctx.body = { rm: updatedRc };
      } else {

        const externalId = `draft-${researchExternalId}-${packageHash}`;
        const researchContentRm = await researchContentService.createResearchContentRef({
          externalId,
          researchExternalId,
          researchGroupExternalId: researchGroupExternalId,
          folder: packageHash,
          researchId: researchInternalId, // legacy internal id
          title: packageHash,
          hash: packageHash,
          algo: "sha256",
          type: "package",
          status: RESEARCH_CONTENT_STATUS.IN_PROGRESS,
          "packageFiles": hashObj.children.map((f) => {
            return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
          }),
          authors: [jwtUsername],
          references: referencesStr ? referencesStr.split(",") : [],
          foreignReferences: []
        });

        ctx.status = 200;
        ctx.body = { rm: researchContentRm };
      }
    }

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getResearchPackageFile = async function (ctx) {
  const hash = ctx.params.hash;
  const researchExternalId = ctx.params.researchExternalId;
  const fileHash = ctx.params.fileHash;
  const isDownload = ctx.query.download === 'true';
  const jwtUsername = ctx.state.user.username;

  const researchContentService = new ResearchContentService();

  const research = await deipRpc.api.getResearchAsync(researchExternalId);
  if (research.is_private) {
    const authorizedGroup = await authService.authorizeResearchGroupAccount(research.research_group.external_id, jwtUsername)
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to get "${research.external_id}" research content`;
      return;
    }
  }

  const rc = await researchContentService.findResearchContentRefByHash(researchExternalId, hash);
  if (rc == null) {
    ctx.status = 404;
    ctx.body = `Package "${hash}" is not found`
    return;
  }

  const file = rc.packageFiles.find(f => f.hash == fileHash);
  if (!file) {
    ctx.status = 404;
    ctx.body = `File "${fileHash}" is not found`
    return;
  }

  if (isDownload) {
    let ext = file.filename.substr(file.filename.lastIndexOf('.') + 1);
    let name = file.filename.substr(0, file.filename.lastIndexOf('.'));
    ctx.response.set('Content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
    ctx.body = fs.createReadStream(researchFilesPackageFilePath(rc.researchExternalId, rc.hash, file.filename));
  } else {
    await send(ctx, researchFilesPackageFilePath(rc.researchExternalId, rc.hash, file.filename), { root: '/' });
  }
}


const createResearchContent = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta, isProposal } = ctx.request.body;

  try {
    const researchContentService = new ResearchContentService();
    const datums = blockchainService.extractOperations(tx);

    const [opName, opPayload] = datums.find(([opName,]) => opName == 'create_research_content');
    const { content: hash, external_id: researchContentExternalId, research_external_id: researchExternalId } = opPayload;
    
    const rc = await researchContentService.findResearchContentRefByHash(researchExternalId, hash);
    const draft = rc ? rc.toObject() : null;
    
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
    await researchContentService.removeResearchContentRefByHash(researchExternalId, hash); // remove draft

    offchainMeta.researchContent.folder = draft.folder;
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
    ctx.body = entityExternalId;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


export default {
  // dar
  listDarArchives,
  readDarArchive,
  readDarArchiveStaticFiles,
  createDarArchive,
  updateDarArchive,

  // files
  uploadBulkResearchContent,
  getResearchPackageFile,

  // refs
  getContentRef,
  getContentRefByHash,

  getResearchContent,
  getResearchContents,
  getResearchContentByResearch,

  // drafts
  deleteContentDraft,
  unlockContentDraft,

  createResearchContent
}