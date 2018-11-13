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
import { findContentByHashOrId, lookupProposal, proposalIsNotExpired } from './../services/researchContent'
import { authorizeResearchGroup } from './../services/auth'
import url from 'url';

const filesStoragePath = path.join(__dirname, './../files');
const opts = {}

// ############ Read actions ############

const listDarArchives = async (ctx) => {
    try {
        const records = await listArchives(filesStoragePath)
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

        const archiveDir = path.join(filesStoragePath, rc.filename);
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
                record.data = `${config['host']}/content/${darId}/assets/${record.path}`
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
        const filePath = path.join(filesStoragePath, rc.filename);
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
    try {
        const draft = await findContentByHashOrId(hashOrId);
        ctx.status = 200;
        ctx.body = draft;
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

        const proposal = await lookupProposal(rc.researchGroupId, rc.hash, rc.type)
        if (proposal && proposalIsNotExpired(proposal)) {
            ctx.status = 405;
            ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be modified`
            return;
        }

        const archiveDir = path.join(filesStoragePath, rc.filename)
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
        const proposal = await lookupProposal(rc.researchGroupId, rc.hash, rc.type)
        if (proposal && proposalIsNotExpired(proposal)) {
            console.log("whyyyyy????")
            ctx.status = 405;
            ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be modified`;
            return;
        }

        rc.status = 'in-progress';
        const updatedRc = rc.save();
        ctx.status = 200;
        ctx.body = updatedRc;
    } catch(err) {
        console.log(err)
        ctx.status = 500;
        ctx.body = err.message;
    }
}

// const clone = async (ctx) => {
//     const originalPath = path.join(filesStoragePath, ctx.params.dar);
//     const newPath = path.join(filesStoragePath, ctx.params.newdar);
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
    
        const blankPath = path.join(filesStoragePath, 'dar-blank');
        const now = new Date().getTime();
    
        const darPath = `/${researchId}/dar_${now}`;
        await cloneArchive(blankPath, path.join(filesStoragePath, darPath));
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
        const proposal = await lookupProposal(rc.researchGroupId, rc.hash, rc.type)
        if (proposal && proposalIsNotExpired(proposal)) {
            ctx.status = 405;
            ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be deleted`;
            return;
        }

        await ResearchContent.remove({ _id: refId });

        if (rc.type === 'dar') {
            await fsExtra.remove(path.join(filesStoragePath, rc.filename));
        } else if (rc.type === 'file') {
            const unlink = util.promisify(fs.unlink);
            await unlink(researchContentPath(rc.researchId, rc.filename));
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
    const hashObj = await hashElement(path.join(filesStoragePath, link), options);
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
          if (parsedUrl.host === config.uiHost) {
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
const researchStoragePath = (researchId) => `${filesStoragePath}/${researchId}/files`
const researchContentPath = (researchId, filename) => `${researchStoragePath(researchId)}/${filename}`

const contentStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        const dest = researchStoragePath(`${req.headers['research-id']}`)
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        callback(null, dest)
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
            fs.stat(researchContentPath(researchId, ctx.req.file.filename), (err, stats) => {
                if (err || !stats.isFile()) {
                    console.error(err);
                    reject(err)
                }
                else {
                    resolve(researchContentPath(researchId, ctx.req.file.filename));
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
                const check = await stat(researchContentPath(researchId, rc.filename));
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

const getFileContent = async function(ctx) {
    const researchId = ctx.params.researchId;
    const hashOrId = ctx.params.hashOrId;
    const isDownload = ctx.query.download;

    const rc =  await findContentByHashOrId(hashOrId);;

    if (rc == null) {
        ctx.status = 404;
        ctx.body = `Content "${hashOrId}" is not found`
        return;
    }

    if (isDownload) {
        ctx.response.set('Content-disposition', 'attachment; filename="' + rc.filename + '"');
        ctx.body = fs.createReadStream(researchContentPath(researchId, rc.filename));
    } else {
        await send(ctx, `/files/${researchId}/files/${rc.filename}`);
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
    getFileContent,

    // refs
    getContentRef,
    listContentRefs,

    // drafts
    deleteContentDraft,
    unlockContentDraft,
}