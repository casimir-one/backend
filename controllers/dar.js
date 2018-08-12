import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
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

const filesStoragePath = path.join(__dirname, './../files');
const opts = {}

const list = async (ctx) => {
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


const drafts = async (ctx) => {
    const researchId = ctx.params.researchId;

    try {
      const drafts = await ResearchContent.find({'research': researchId, 'status': { $in: ['in-progress', 'proposed'] }});
      ctx.status = 200;
      ctx.body = drafts;

    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


const read = async (ctx) => {
    const draftId = ctx.params.dar || 'default'
    const parsed = parseDraftId(draftId)
    if (!parsed) {
        ctx.status = 400;
        ctx.body = `"Bad request for /${ctx.params.dar}"`;
        return;
    }
    const { link } = parsed;
    
    try {
 
        const archiveDir = path.join(filesStoragePath, link);
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
                record.data = `${config['host']}/dar/${draftId}/assets/${record.path}`
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

const readStatic = async (ctx) => {
    const draftId = ctx.params.dar;
    const parsed = parseDraftId(draftId)
    if (!parsed) {
        ctx.status = 400;
        ctx.body = `"Bad request for /${ctx.params.dar}"`;
        return;
    }
    
    const { link } = parsed;

    const stat = util.promisify(fs.stat);
    const filePath = path.join(filesStoragePath, link);
    try {
        const check = await stat(filePath);
        await send(ctx, `/files` + `${link}/${ctx.params.file}`);
    } catch(err) {
        console.log(err);
        ctx.status = 404;
        ctx.body = err.message;
    }
}

const write = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const draftId = ctx.params.dar;
    const parsed = parseDraftId(draftId)

    if (!parsed) {
        ctx.status = 400;
        ctx.body = `"Bad request for /${ctx.params.dar}"`;
        return;
    }

    const { link, researchId } = parsed;
    const isPermitted = await authorizeResearchGroup(researchId, jwtUsername)

    if (!isPermitted) {
        ctx.status = 401;
        ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
        return;
    }

    const rc = await ResearchContent.findOne({'_id': draftId })

    if (!rc || rc.status != 'in-progress') {
        ctx.status = 400;
        ctx.body = `Research "${draftId}" is locked for updates or does not exist`;
        return;
    }

    const formValidation = () => new Promise(resolve => {
        parseFormdata(ctx.req, (err, formData) => {
            if (err) {
                resolve({isSuccess: false, err: err})
            } else {
                resolve({isSuccess: true, formData: formData})
            }
        })
    })


    try {

        const result = await formValidation();
        if (!result.isSuccess) {
            ctx.status = 400;
            ctx.body = result.err.message;
            return;
        }

        const archiveDir = path.join(filesStoragePath, link)
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

        await updateDraftMetaAsync(draftId, archive, link);

        ctx.status = 200;
        ctx.body = version;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


const createDarProposal = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;

    const operation = tx['operations'][0];
    const payload = operation[1];
    
    const groupId = payload.research_group_id;
    const proposal = JSON.parse(payload.data);
    const hash = proposal.content.slice(4);

    if (!hash || !groupId) {
        ctx.status = 400;
        ctx.body = `Bad request: "${tx}"`;
        return;
    }
    
    const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(jwtUsername);

    if (!rgtList.some(rgt => rgt.research_group_id == groupId)) {
        ctx.status = 401;
        ctx.body = `"${jwtUsername}" is not a member of "${groupId}" group`
        return;
    }

    try {

        const rc = await ResearchContent.findOne({'hash': hash })

        if (!rc) {
            ctx.status = 500;
            ctx.body = `Research content with hash "${hash}" does not exist`
            return;
        }

        if (rc.status != 'in-progress') {
            ctx.status = 409;
            ctx.body = `Research content with "${rc.title}" is '${rc.status}'`
            return;
        }

        rc.status = 'proposed';
        const updatedRc = await rc.save()

        const result = await sendTransaction(tx)
        
        if (result.isSuccess) {
            ctx.status = 200;
            ctx.body = updatedRc;
        } else {
            await rollback(rc);
            throw new Error('Could not proceed the transaction');
        }

    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }

    const rollback = async (rc) => {
        rc.status = 'proposed';
        await rc.save()
    }
}


const updateDraftMetaAsync = async (id, archive, link) => {

    const parseTitleAsync = () => new Promise(resolve => {
        xml2js.parseString(archive.resources['manuscript.xml'].data, (err, result) => {
            if (err) {
                resolve(null)
                return;
            }
            try {
                const title = result['article']['front'][0]['article-meta'][0]['title-group'][0]['article-title'][0]['_'];
                resolve(title)
            } catch(err) {
                resolve(null)
            }
        })
    })

    const title = await parseTitleAsync();

    const options = { algo: 'md5', encoding: 'hex' };
    const hashObj = await hashElement(path.join(filesStoragePath, link), options);
    const rc = await ResearchContent.findOne({'_id': id})

    if (title) {
        rc.title = title;
    }
    console.log(hashObj)
    rc.hash = hashObj.hash;

    await rc.save()
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

const create = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const researchId = parseInt(ctx.params.researchId);

    if (isNaN(researchId)) {
        ctx.status = 400;
        ctx.body = `"${ctx.params.researchId}" is invalid research id`;
        return;
    }

    const isPermitted = await authorizeResearchGroup(researchId, jwtUsername)

    if (!isPermitted) {
        ctx.status = 401;
        ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
        return;
    }

    const blankPath = path.join(filesStoragePath, 'dar-blank');
    const now = new Date().getTime();
    try {
        await cloneArchive(blankPath, path.join(filesStoragePath, `/${researchId}/dar_${now}`));
        const rc = new ResearchContent({
            "_id": `${researchId}_dar_${now}`,
            "filename": `dar_${now}/manifest.xml`,
            "research": researchId,
            "type": "dar",
            "status": "in-progress"
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

const deleteDraft = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const draftId = ctx.params.draftId;
    const parsed = parseDraftId(draftId)

    if (!parsed) {
        ctx.status = 400;
        ctx.body = `"Bad request for /${ctx.params.draftId}"`;
        return;
    }

    const { link, researchId } = parsed;
    const isPermitted = await authorizeResearchGroup(researchId, jwtUsername)

    if (!isPermitted){
        ctx.status = 401;
        ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
        return;
    }

    try {

        await ResearchContent.remove({ _id: draftId });
        await fsExtra.remove(path.join(filesStoragePath, link));
        ctx.status = 201;

    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const calculateHash = async (ctx) => {
    const draftId = ctx.params.draftId;
    const parsed = parseDraftId(draftId)
    if (!parsed) {
        ctx.status = 400;
        ctx.body = `"Bad request for /${ctx.params.draftId}"`;
        return;
    }
    const { link } = parsed;

    const options = { algo: 'md5', encoding: 'hex' };

    try {
        const hash = await hashElement(path.join(filesStoragePath, link), options);
        ctx.status = 200;
        ctx.body = hash;
    } catch (err){
        console.error('hashing failed:', error);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const getDraftMeta = async (ctx) => {
    const hashOrId = ctx.params.hashOrId;
    try {
        const draft = await ResearchContent.findOne({ $or: [ { _id: hashOrId }, { hash: hashOrId } ] });
        ctx.status = 200;
        ctx.body = draft;
    } catch (err){
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const authorizeResearchGroup = async (researchId, username) => {

    const research = await deipRpc.api.getResearchByIdAsync(researchId);
    if (!research) return false;
    
    const groupId = research.research_group_id;
    const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);

    if (!rgtList.some(rgt => rgt.research_group_id == groupId)) return false;

    return true;
}

const parseDraftId = (draftId) => {
    const parts = draftId.split('_');

    if (parts.length != 3) return undefined;
    if (isNaN(parseInt(parts[0]))) return undefined;

    return { 
        researchId: parseInt(parts[0]), 
        link: `/${parts[0]}/${parts[1]}_${parts[2]}`
    }
}

export default {
    list,
    read,
    readStatic,
    write,
    create,
    drafts,
    deleteDraft,
    calculateHash,
    getDraftMeta,
    createDarProposal
}