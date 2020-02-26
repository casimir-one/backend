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
import deipRpc from '@deip/deip-oa-rpc-client';
import ResearchContent from './../schemas/researchContent';
import xml2js from 'xml2js';
import { hashElement } from 'folder-hash';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findResearchContentById, findResearchContentByHash, lookupContentProposal, proposalIsNotExpired } from './../services/researchContent'
import { bulkResearchContentUploader } from './../storages/bulkResearchContentUploader';
import { authorizeResearchGroup } from './../services/auth'
import url from 'url';
import crypto from 'crypto';
import rimraf from "rimraf";
import slug from 'limax';

const storagePath = path.join(__dirname, `./../${config.fileStorageDir}`);
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

const listContentRefs = async (ctx) => {
  const researchId = ctx.params.researchId;
  try {
    let drafts = await ResearchContent.find({'researchId': researchId });
    ctx.status = 200;
    ctx.body = drafts;
  } catch(err) {
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
        const rc = await findResearchContentById(darId);
        if (!rc) {
            ctx.status = 404;
            ctx.body = `Dar for "${darId}" id is not found`;
            return;
        }

        const archiveDir = researchDarArchivePath(rc.researchId, rc.folder);
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
                record.data = `${config['serverHost']}/content/${darId}/assets/${record.path}?authorization=${jwt}`;
            }
        })
        ctx.status = 200;
        ctx.body = rawArchive;

    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const readDarArchiveStaticFiles = async (ctx) => {
    const darId = ctx.params.dar;
    try {
        const rc = await findResearchContentById(darId);
        const archivePath = researchDarArchivePath(rc.researchId, rc.folder);

        const stat = util.promisify(fs.stat);
        const check = await stat(archivePath);
        await send(ctx, researchDarArchiveFilePath(rc.researchId, rc.folder, ctx.params.file), { root: '/' });        
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const getContentRefById = async (ctx) => {
    const refId = ctx.params.refId;
    try {
        const ref = await findResearchContentById(refId);
        ctx.status = 200;
        ctx.body = ref;
    } catch (err){
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const getContentRefByHash = async (ctx) => {
    const hash = ctx.params.hash;
    const researchId = ctx.params.researchId;
    try {
        const ref = await findResearchContentByHash(researchId, hash);
        ctx.status = 200;
        ctx.body = ref;
    } catch (err){
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
                resolve({isSuccess: false, err: err})
            } else {
                resolve({isSuccess: true, formData: formData})
            }
        })
    });

    try {
        const rc = await findResearchContentById(darId);
        if (!rc || rc.status != 'in-progress') {
            ctx.status = 405;
            ctx.body = `Research "${darId}" is locked for updates or does not exist`;
            return;
        }
        const authorized = await authorizeResearchGroup(rc.researchGroupId, jwtUsername)
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

        const proposal = await lookupContentProposal(rc.researchGroupId, rc.hash, rc.type)
        if (proposal && proposalIsNotExpired(proposal)) {
            ctx.status = 405;
            ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be modified`
            return;
        }

        const archiveDir = researchDarArchivePath(rc.researchId, rc.folder);
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

        await updateDraftMetaAsync(darId, archive, rc.folder);
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
        const rc = await findResearchContentById(refId);
        if (!rc || (rc.status != 'proposed' && rc.status != 'completed')) {
            ctx.status = 405;
            ctx.body = `Proposed "${refId}" content archive is not found`;
            return;
        }

        const authorized = await authorizeResearchGroup(rc.researchGroupId, jwtUsername)
        if (!authorized) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${rc.researchId}" research`;
            return;
        }

        // if there is a proposal for this content (no matter it is approved or still in voting progress)
        // we must respond with an error as blockchain hashed data should not be modified
        const proposal = await lookupContentProposal(rc.researchGroupId, rc.hash, rc.type)
        if (proposal && proposalIsNotExpired(proposal)) {
            ctx.status = 405;
            ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be modified`;
            return;
        }

        rc.status = 'in-progress';
        const updatedRc = await rc.save();
        ctx.status = 200;
        ctx.body = updatedRc;
    } catch(err) {
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
    const researchId = parseInt(ctx.params.researchId);

    if (isNaN(researchId)) {
        ctx.status = 400;
        ctx.body = `"${researchId}" is invalid research id`;
        return;
    }

    try {
        const research = await deipRpc.api.getResearchByIdAsync(researchId);
        const authorized = await authorizeResearchGroup(research.research_group_id, jwtUsername)
        if (!authorized) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
            return;
        }

        const now = new Date().getTime();
        const darPath = researchDarArchivePath(researchId, `dar_${now}`);
        await cloneArchive(blankDarPath, darPath);
        const rc = new ResearchContent({
            "_id": `${researchId}_dar_${now}`,
            "folder": `dar_${now}`,
            "researchId": researchId,
            "researchGroupId": research.research_group_id,
            "type": "dar",
            "status": "in-progress",
            "authors": [],
            "references": [],
            "externalReferences": []
        });
    
        const savedDraft = await rc.save();
        ctx.status = 200;
        ctx.body = {
            draft: savedDraft
        };
    
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const deleteContentDraft = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const refId = ctx.params.refId;

    try {
        const rc = await findResearchContentById(refId);
        if (!rc) {
            ctx.status = 404;
            ctx.body = `Dar for "${refId}" id is not found`;
            return;
        }

        const authorized = await authorizeResearchGroup(rc.researchGroupId, jwtUsername)
        if (!authorized) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
            return;
        }

        // if there is a proposal for this content (no matter is it approved or still in voting progress)
        // we must respond with an error as blockchain hashed data should not be modified
        const proposal = await lookupContentProposal(rc.researchGroupId, rc.hash, rc.type)
        if (proposal && proposalIsNotExpired(proposal)) {
            ctx.status = 405;
            ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be deleted`;
            return;
        }

        const unlink = util.promisify(fs.unlink);

        if (rc.type === 'dar') {
            await fsExtra.remove(path.join(storagePath, rc.folder));
        } else if (rc.type === 'file') {
            await unlink(researchFileContentPath(rc.researchId, rc.folder));
        } else if (rc.type === 'package') {
            await fsExtra.remove(researchFilesPackagePath(rc.researchId, rc.hash));
        }

        await ResearchContent.remove({ _id: refId });
        ctx.status = 201;

    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const updateDraftMetaAsync = async (researchContentId, archive) => {
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
            } catch(err) {}
            try {
                authors = result['article']['front'][0]['article-meta'][0]['contrib-group'][0]['contrib']
                    .filter(p => p['string-name']).map(p => p['string-name'][0]['_'])
                    .filter(username => username != null && username != '');
            } catch(err) {}
            try {
                references = parseInternalReferences(result['article']['back'][0]['ref-list'][0]['ref']);
            } catch(err) {}

            resolve({ title, authors, references });
        })
    })

    const { title, authors, references } = await parseDraftMetaAsync();
    const rc = await ResearchContent.findOne({ '_id': researchContentId })

    const accounts = [];
    for (let i = 0; i < authors.length; i++) {
        const username = authors[i];
        const hasRgt = await authorizeResearchGroup(rc.researchGroupId, username)
        if (hasRgt) {
            accounts.push(username)
        }
    }

    const contentRefs = [];
    for (let i = 0; i < references.length; i++) {
        const ref = references[i];
        const contentRef = await deipRpc.api.getResearchContentByAbsolutePermlinkAsync(ref.researchGroupPermlink, ref.researchPermlink, ref.researchContentPermlink);
        if (contentRef.research_id != rc.researchId) {
            contentRefs.push(contentRef.id);
        }
    }

    rc.title = title || '';
    rc.authors = accounts;
    rc.references = contentRefs;
    
    const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };

    const archiveDir = researchDarArchivePath(rc.researchId, rc.folder);
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
    const webpageRefs = refList.filter(ref => {
        try {
            return ref['element-citation'][0]['$']['publication-type'] === 'webpage';
        } catch(err) {
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
                if (parsedUrl.href.indexOf(config.clientHost) === 0) {
                    const segments = parsedUrl.hash.split('/');
                    const researchGroupPermlink = decodeURIComponent(segments[1]);
                    const researchPermlink = decodeURIComponent(segments[3]);
                    const researchContentPermlink = decodeURIComponent(segments[4]);
                    return { researchGroupPermlink, researchPermlink, researchContentPermlink };
                }
            } catch(err) {
                console.log(err);
            }
            return null;
        })
      .filter(r => r != null);

    return deipRefs;
};

// ############# files ######################

const uploadBulkResearchContent = async(ctx) => {
    const jwtUsername = ctx.state.user.username;
    const researchId = ctx.request.header['research-id'];
    const internalReferencesStr = ctx.request.header['internal-refs'];

    if (!researchId || isNaN(parseInt(researchId))) {
        ctx.status = 400;
        ctx.body = { error: `"Research-Id" header is required` };
        return;
    }

    const stat = util.promisify(fs.stat);
    const ensureDir = util.promisify(fsExtra.ensureDir);

    try {
        const researchFilesTempStorage = researchFilesTempStoragePath(ctx.request.header['research-id'], ctx.request.header['upload-session'])
        await ensureDir(researchFilesTempStorage);
        
        const research = await deipRpc.api.getResearchByIdAsync(researchId);
        const authorized = await authorizeResearchGroup(research.research_group_id, jwtUsername)
        if (!authorized) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
            return;
        }
    
        const researchContent = bulkResearchContentUploader.any();
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
        const rc = await findResearchContentByHash(researchId, packageHash);
        const packagePath = researchFilesPackagePath(researchId, packageHash);

        if (rc) {
            try {
                const check = await stat(packagePath);
                exists = true;
            } catch(err) {
                exists = false;
            }
        }
        
        if (exists) {
            console.log(`Folder ${packageHash} already exists! Removing the uploaded files...`);
            rimraf(tempDestinationPath, function () { console.log(`${tempDestinationPath} removed`); });
            ctx.status = 200;
            ctx.body = rc;
        } else {

            await fsExtra.move(tempDestinationPath, packagePath, { overwrite: true });
            
            if (rc) {
                rc.folder = packageHash;
                const updatedRc = await rc.save();
                ctx.status = 200;
                ctx.body = updatedRc;
            } else {

                const _id = `${researchId}_package_${packageHash}`;
                const rc = new ResearchContent({
                    "_id": _id,
                    "folder": packageHash,
                    "title": `${packageHash}`,
                    "researchId": researchId,
                    "researchGroupId": research.research_group_id,
                    "hash": packageHash,
                    "algo": "sha256",
                    "type": 'package',
                    "status": "in-progress",
                    "authors": [jwtUsername],
                    "packageFiles": hashObj.children.map((f) => {
                        return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
                    }),
                    "references": internalReferencesStr ? internalReferencesStr.split(",").map(refId => parseInt(refId)) : [],
                    "externalReferences": []
                });
                const savedRc = await rc.save();
                ctx.status = 200;
                ctx.body = savedRc;
            }
        }

    } catch(err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
    }
}

const getResearchPackageFile = async function(ctx) {
    const hash = ctx.params.hash;
    const researchId = ctx.params.researchId;
    const fileHash = ctx.params.fileHash;
    const isDownload = ctx.query.download === 'true';
    const jwtUsername = ctx.state.user.username;

    const research = await deipRpc.api.getResearchByIdAsync(researchId);
    if (research.is_private) {
      const authorized = await authorizeResearchGroup(research.research_group_id, jwtUsername)
      if (!authorized) {
        ctx.status = 401;
        ctx.body = `"${jwtUsername}" is not permitted to get "${researchId}" research content`;
        return;
      }
    }

    const rc = await findResearchContentByHash(researchId, hash);
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
        ctx.body = fs.createReadStream(researchFilesPackageFilePath(rc.researchId, rc.hash, file.filename));
    } else {
        await send(ctx, researchFilesPackageFilePath(rc.researchId, rc.hash, file.filename), { root: '/' });
    }
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
    getContentRefById,
    getContentRefByHash,
    listContentRefs,

    // drafts
    deleteContentDraft,
    unlockContentDraft
}