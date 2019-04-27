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
import deipRpc from '@deip/deip-rpc-client';
import ResearchContent from './../schemas/researchContent';
import xml2js from 'xml2js';
import { hashElement } from 'folder-hash';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findContentByHashOrId, findResearchContentByHash, lookupContentProposal, proposalIsNotExpired } from './../services/researchContent'
import { bulkResearchContentUploader } from './../storages/bulkResearchContentUploader';
import { authorizeResearchGroup } from './../services/auth'
import url from 'url';
import crypto from 'crypto';
import rimraf from "rimraf";

const storagePath = path.join(__dirname, './../files');
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
        const drafts = await ResearchContent.find({'researchId': researchId });
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

    try {
        const rc = await findContentByHashOrId(darId);
        if (!rc) {
            ctx.status = 404;
            ctx.body = `Dar for "${darId}" id is not found`;
            return;
        }

        const archiveDir = path.join(storagePath, rc.filename);
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
                record.data = `${config['serverHost']}/content/${darId}/assets/${record.path}`
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
        const rc = await findContentByHashOrId(darId);
        const stat = util.promisify(fs.stat);
        const filePath = path.join(storagePath, rc.filename);
        const check = await stat(filePath);
        await send(ctx, `/files` + `${rc.filename}/${ctx.params.file}`);
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const getContentRef = async (ctx) => {
    const hashOrId = ctx.params.hashOrId;
    const researchId = ctx.params.researchId;
    try {
        const ref = await findResearchContentByHash(researchId, hashOrId);
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
        const rc = await findContentByHashOrId(darId);
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

        const archiveDir = path.join(storagePath, rc.filename)
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

        await updateDraftMetaAsync(darId, archive, rc.filename);
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
    const darId = ctx.params.refId;
    
    try {
        const rc = await findContentByHashOrId(darId);
        if (!rc || (rc.status != 'proposed' && rc.status != 'completed')) {
            ctx.status = 405;
            ctx.body = `Proposed "${darId}" content archive is not found`;
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
            console.log("whyyyyy????")
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
    
        const blankPath = path.join(storagePath, 'dar-blank');
        const now = new Date().getTime();
    
        const darPath = `/${researchId}/dar_${now}`;
        await cloneArchive(blankPath, path.join(storagePath, darPath));
        const rc = new ResearchContent({
            "_id": `${researchId}_dar_${now}`,
            "filename": darPath,
            "researchId": researchId,
            "researchGroupId": research.research_group_id,
            "type": "dar",
            "status": "in-progress",
            "authors": [],
            "references": []
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
        const rc = await findContentByHashOrId(refId);
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

        await ResearchContent.remove({ _id: refId });

        if (rc.type === 'dar') {
            await fsExtra.remove(path.join(storagePath, rc.filename));
        } else if (rc.type === 'file') {
            const unlink = util.promisify(fs.unlink);
            await unlink(researchFileContentPath(rc.researchId, rc.filename));
        }

        ctx.status = 201;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const updateDraftMetaAsync = async (id, archive, link) => {
    const parseDraftMetaAsync = () => new Promise(resolve => {
        xml2js.parseString(archive.resources['manuscript.xml'].data, (err, result) => {
            if (err) {
                resolve(null)
                return;
            }
            let title = null;
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
                references = parseDeipReferences(result['article']['back'][0]['ref-list'][0]['ref'])
            } catch(err) {}

            resolve({ title, authors, references })
        })
    })

    const { title, authors, references } = await parseDraftMetaAsync();
    const rc = await ResearchContent.findOne({ '_id': id })

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
    
    const options = { algo: 'md5', encoding: 'hex' };
    const hashObj = await hashElement(path.join(storagePath, link), options);
    console.log(hashObj)
    rc.hash = hashObj.hash;
    await rc.save()
}

const parseDeipReferences = (refList) => {
    const webpageRefs = refList.filter(ref => {
        try {
            return ref['element-citation'][0]['$']['publication-type'] === 'webpage'
        } catch(err) {
            return false;
        }
    }).map(ref => {
        return ref['element-citation'][0];
    });
    const deipRefs = webpageRefs.map(wref => {
        try {
          const parsedUrl = url.parse(wref.uri[0]);
          if (parsedUrl.serverHost === config.uiHost) { // get rid of this
            const segments = parsedUrl.hash.split('/');
            const researchGroupPermlink = segments[1];
            const researchPermlink = segments[3];
            const researchContentPermlink = segments[4];
            return { researchGroupPermlink, researchPermlink, researchContentPermlink }
          }
        } catch(err) {
            console.log(err)
        }
        return null;
        })
      .filter(r => r != null);

    return deipRefs;
};

// ############# files ######################
const researchStoragePath = (researchId) => `${storagePath}/${researchId}`
const researchFileStoragePath = (researchId) => `${storagePath}/${researchId}`
const researchFilesTempStoragePath = (researchId, postfix) => `${researchFileStoragePath(researchId)}/temp-${postfix}`
const researchFilesPackagePath = (researchId, packageHash) => `${researchFileStoragePath(researchId)}/${packageHash}`
const researchFilesPackageFilePath = (researchId, packageHash, fileHash) => `${researchFilesPackagePath(researchId, packageHash)}/${fileHash}`

const contentStorage = multer.diskStorage({
    destination: async function(req, file, callback) {

        const stat = util.promisify(fs.stat);
        const mkdir = util.promisify(fs.mkdir);

        const researchStorage = researchStoragePath(req.headers['research-id']);
        try {
            const check = await stat(researchStorage);
        } catch(err) {
            await mkdir(researchStorage);
        }

        const researchFileStorage = researchFileStoragePath(req.headers['research-id'])
        try {
            const check = await stat(researchFileStorage);
        } catch(err) {
            await mkdir(researchFileStorage);
        }

        callback(null, researchFileStorage);
    },
    filename: function(req, file, callback) {
        callback(null, (new Date).getTime() + '_' + file.originalname);
    }
})

const allowedContentMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']
const contentUploader = multer({
    storage: contentStorage,
    fileFilter: function(req, file, callback) {
        if (allowedContentMimeTypes.find(mime => mime === file.mimetype) === undefined) {
            return callback(new Error('Only the following mime types are allowed: ' + allowedContentMimeTypes.join(', ')), false);
        }
        callback(null, true);
    }
})


const researchFileContentPath = (researchId, filename) => `${researchFileStoragePath(researchId)}/${filename}`
const uploadFileContent = async(ctx) => {
    const jwtUsername = ctx.state.user.username;

    const researchId = ctx.request.header['research-id'];
    if (!researchId || isNaN(parseInt(researchId))) {
        ctx.status = 400;
        ctx.body = { error: `"Research-Id" header is required` };
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

        const researchContent = contentUploader.single('research-content');
        const filepath = await researchContent(ctx, () => new Promise((resolve, reject) => {
            fs.stat(researchFileContentPath(researchId, ctx.req.file.filename), (err, stats) => {
                if (err || !stats.isFile()) {
                    console.error(err);
                    reject(err)
                }
                else {
                    resolve(researchFileContentPath(researchId, ctx.req.file.filename));
                }
            });
        }));

        const options = { algo: 'md5', encoding: 'hex', files: { ignoreRootName: true }};
        const hashObj = await hashElement(filepath, options);

        var exists = false;
        const _id = `${researchId}_file_${hashObj.hash}`;
        const rc = await findContentByHashOrId(_id);

        if (rc) {
            const stat = util.promisify(fs.stat);
            try {
                const check = await stat(researchFileContentPath(researchId, rc.filename));
                exists = true;
            } catch(err) {
                exists = false;
            }
        }

        if (exists) {
            console.log(`File with ${hashObj.hash} hash already exists! Removing the uploaded file...`);
            const unlink = util.promisify(fs.unlink);
            await unlink(filepath);
            ctx.status = 200;
            ctx.body = rc;
        } else {

            if (rc) {
                rc.filename = hashObj.name
                const updatedRc = await rc.save();
                ctx.status = 200;
                ctx.body = updatedRc;
            } else {
                const rc = new ResearchContent({
                    "_id": _id,
                    "filename": hashObj.name,
                    title: hashObj.name,
                    "researchId": researchId,
                    "researchGroupId": research.research_group_id,
                    "hash": hashObj.hash,
                    "type": 'file',
                    "status": 'in-progress',
                    "authors": [jwtUsername],
                    "references": []
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

const uploadBulkResearchContent = async(ctx) => {
    const jwtUsername = ctx.state.user.username;
    const researchId = ctx.request.header['research-id'];

    if (!researchId || isNaN(parseInt(researchId))) {
        ctx.status = 400;
        ctx.body = { error: `"Research-Id" header is required` };
        return;
    }

    const stat = util.promisify(fs.stat);
    const mkdir = util.promisify(fs.mkdir);

    try {
        const researchFilesTempStorage = researchFilesTempStoragePath(ctx.request.header['research-id'], ctx.request.header['upload-session'])
        try {
            const check = await stat(researchFilesTempStorage);
        } catch(err) {
            await mkdir(researchFilesTempStorage);
        }

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

        const options = { algo: 'md5', encoding: 'hex', files: { ignoreRootName: true }};
        const hashObj = await hashElement(tempDestinationPath, options);
        console.log(hashObj);
        const hashes = hashObj.children.map(f => f.hash);
        hashes.sort();
        const packageHash = crypto.createHash('md5').update(hashes.join(",")).digest("hex");

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
                rc.filename = `Package: content [${packageHash}];'`
                const updatedAc = await rc.save();
                ctx.status = 200;
                ctx.body = updatedAc;
            } else {

                const _id = `${researchId}_package_${packageHash}`;
                const rc = new ResearchContent({
                    "_id": _id,
                    "filename": `Package: content [${packageHash}];`,
                    "title": `package ${packageHash}`,
                    "researchId": researchId,
                    "researchGroupId": research.research_group_id,
                    "hash": packageHash,
                    "type": 'package',
                    "status": "in-progress",
                    "authors": [jwtUsername],
                    "packageFiles": hashObj.children.map((f) => {
                        return { filename: f.name, hash: f.hash }
                    }),
                    "references": []
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
    const isDownload = ctx.query.download;

    const rc = await findResearchContentByHash(researchId, hash);

    if (rc == null) {
        ctx.status = 404;
        ctx.body = `Package "${hash}" is not found`
        return;
    }

    const file = rc.packageFiles.find(f => f.hash == fileHash);
    if (isDownload) {
        ctx.response.set('Content-disposition', 'attachment; filename="' + file.filename + '"');
        ctx.body = fs.createReadStream(researchFilesPackageFilePath(rc.researchId, rc.hash, rc.fileHash));
    } else {
        await send(ctx, `/files/${rc.researchId}/${rc.hash}/${file.filename}`);
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
    uploadFileContent,
    uploadBulkResearchContent,
    getResearchPackageFile,

    // refs
    getContentRef,
    listContentRefs,

    // drafts
    deleteContentDraft,
    unlockContentDraft
}