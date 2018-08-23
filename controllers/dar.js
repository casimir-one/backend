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


const listDarDrafts = async (ctx) => {
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


const readDarArchive = async (ctx) => {
    const darId = ctx.params.dar;

    try {
        const rc = await findDarByHashOrId(darId);
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
                record.data = `${config['host']}/dar/${darId}/assets/${record.path}`
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
        const rc = await findDarByHashOrId(darId);
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

const getDarDraftMeta = async (ctx) => {
    const hashOrId = ctx.params.hashOrId;
    try {
        const draft = await findDarByHashOrId(hashOrId);
        ctx.status = 200;
        ctx.body = draft;
    } catch (err){
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const calculateHash = async (ctx) => {
    const darId = ctx.params.draftId;

    try {
        const rc = await findDarByHashOrId(darId);
        if (!rc) {
            ctx.status = 404;
            ctx.body = `Dar for "/${darId}" is not found `;
            return;
        }
        const options = { algo: 'md5', encoding: 'hex' };
        const hash = await hashElement(path.join(filesStoragePath, rc.filename), options);
        ctx.status = 200;
        ctx.body = hash;
    } catch (err){
        console.error(err);
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
        const rc = await findDarByHashOrId(darId);
        if (!rc || rc.status != 'in-progress') {
            ctx.status = 405;
            ctx.body = `Research "${darId}" is locked for updates or does not exist`;
            return;
        }

        const groupId = await authorizeResearchGroup(rc.research, jwtUsername)
        if (groupId === null) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${rc.research}" research`;
            return;
        }

        const result = await formValidation();
        if (!result.isSuccess) {
            ctx.status = 400;
            ctx.body = result.err.message;
            return;
        }

        const proposal = await lookupProposal(groupId, rc.hash)
        if (proposal) {
            ctx.status = 409;
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


const createDarProposal = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;

    const operation = tx['operations'][0];
    const payload = operation[1];
    console.log(payload)

    const proposal = JSON.parse(payload.data);
    const hash = proposal.content.slice(4);
    console.log(proposal)
    const researchId = proposal.research_id;
    const opGroupId = payload.research_group_id;

    if (!hash || !opGroupId) {
        ctx.status = 400;
        ctx.body = `Mallformed operation: "${operation}"`;
        return;
    }

    try {
        const groupId = await authorizeResearchGroup(researchId, jwtUsername);
        if (groupId === null || groupId !== parseInt(opGroupId)) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not a member of "${groupId}" group`
            return;
        }

        const rc = await findDarByHashOrId(hash);
        if (!rc) {
            ctx.status = 404;
            ctx.body = `Research content with hash "${hash}" does not exist`
            return;
        }
        if (rc.status != 'in-progress') {
            ctx.status = 405;
            ctx.body = `Research content "${rc.title}" has '${rc.status}' status`
            return;
        }

        const proposal = await lookupProposal(groupId, hash)
        if (proposal) {
            ctx.status = 409;
            ctx.body = `Proposal for content with hash '${hash}' already exists`
            return;
        }

        rc.status = 'proposed';
        const updatedRc = await rc.save()
        const result = await sendTransaction(tx)
        if (result.isSuccess) {
            ctx.status = 200;
            ctx.body = updatedRc;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }

    } catch(err) {
        console.log(err);
        await rollback(hash);
        ctx.status = 500;
        ctx.body = err.message;
    }

    const rollback = async (hash) => {
        const rc = await findDarByHashOrId(hash)
        rc.status = 'in-progress';
        await rc.save()
    }
}


const unlockDarDraft = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const darId = ctx.params.draftId;
    
    try {
        const rc = await findDarByHashOrId(darId);
        if (!rc || (rc.status != 'proposed' && rc.status != 'completed')) {
            ctx.status = 405;
            ctx.body = `Proposed "${darId}" content archive is not found`;
            return;
        }

        const groupId = await authorizeResearchGroup(rc.research, jwtUsername)
        if (groupId === null) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${rc.research}" research`;
            return;
        }

        // if there is a proposal for this content (no matter it is approved or still in voting progress)
        // we must respond with an error as blockchain hashed data should not be modified
        const proposal = await lookupProposal(groupId, rc.hash)
        if (proposal) {
            ctx.status = 409;
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
        const groupId = await authorizeResearchGroup(researchId, jwtUsername)
        if (groupId === null) {
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

const deleteDarDraft = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const darId = ctx.params.draftId;

    try {
        const rc = await findDarByHashOrId(darId);
        if (!rc) {
            ctx.status = 404;
            ctx.body = `Dar for "${darId}" id is not found`;
            return;
        }

        const groupId = await authorizeResearchGroup(rc.research, jwtUsername)
        if (groupId === null) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
            return;
        }

        // if there is a proposal for this content (no matter is it approved or still in voting progress)
        // we must respond with an error as blockchain hashed data should not be modified
        const proposal = await lookupProposal(groupId, rc.hash)
        if (proposal) {
            ctx.status = 409;
            ctx.body = `Content with hash ${rc.hash} has been proposed already and cannot be deleted`;
            return;
        }

        await ResearchContent.remove({ _id: darId });
        await fsExtra.remove(path.join(filesStoragePath, rc.filename));
        ctx.status = 201;
    } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const authorizeResearchGroup = async (researchId, username) => {
    const research = await deipRpc.api.getResearchByIdAsync(researchId);
    if (!research) return null;
    const groupId = research.research_group_id;
    const rgtList = await deipRpc.api.getResearchGroupTokensByAccountAsync(username);
    if (!rgtList.some(rgt => rgt.research_group_id == groupId)) return null;
    return groupId;
}

const findDarByHashOrId = async (hashOrId) => {
    const rc = await ResearchContent.findOne({ $or: [ { _id: hashOrId }, { hash: hashOrId } ] });
    return rc;
}

const lookupProposal = async (groupId, hash) => {
    const proposals = await deipRpc.api.getProposalsByResearchGroupIdAsync(groupId);
    const content = proposals.filter(p => p.action == 11).find(p => {
        const data = JSON.parse(p.data);
        return data.content == `dar:${hash}`;
    });
    return content;
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

export default {
    listDarArchives,
    readDarArchive,
    readDarArchiveStaticFiles,
    createDarArchive,
    updateDarArchive,

    listDarDrafts,
    deleteDarDraft,
    calculateHash,
    getDarDraftMeta,
    createDarProposal,
    unlockDarDraft
}