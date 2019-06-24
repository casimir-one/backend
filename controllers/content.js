import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import deipRpc from '@deip/deip-rpc-client';
import ResearchContent from './../schemas/researchContent';
import { hashElement } from 'folder-hash';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findResearchContentById, findResearchContentByHash } from './../services/researchContent';
import { bulkResearchContentUploader, researchFilesTempStoragePath, researchFilesPackagePath, researchFilesPackageFilePath } from './../storages/bulkResearchContentUploader';
import { authorizeResearchGroup } from './../services/auth';
import crypto from 'crypto';
import rimraf from "rimraf";
import slug from 'limax';

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

const uploadBulkResearchContent = async(ctx) => {
    const jwtUsername = ctx.state.user.username;
    const researchId = ctx.request.header['research-id'];

    if (!researchId || isNaN(parseInt(researchId))) {
        ctx.status = 400;
        ctx.body = { error: `"Research-Id" header is required` };
        return;
    }

    const stat = util.promisify(fs.stat);
    const mkdirRecursive = util.promisify(fsExtra.ensureDir);

    try {
        const researchFilesTempStorage = researchFilesTempStoragePath(ctx.request.header['research-id'], ctx.request.header['upload-session'])
        try {
            const check = await stat(researchFilesTempStorage);
        } catch(err) {
            await mkdirRecursive(researchFilesTempStorage);
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
                rc.filename = `package: [${packageHash}]`
                const updatedAc = await rc.save();
                ctx.status = 200;
                ctx.body = updatedAc;
            } else {

                const _id = `${researchId}_package_${packageHash}`;
                const rc = new ResearchContent({
                    "_id": _id,
                    "filename": `package [${packageHash}]`,
                    "title": `${packageHash}`,
                    "researchId": researchId,
                    "researchGroupId": research.research_group_id,
                    "hash": packageHash,
                    "type": 'package',
                    "status": "in-progress",
                    "authors": [jwtUsername],
                    "packageFiles": hashObj.children.map((f) => {
                        return { filename: f.name, hash: f.hash, ext: path.extname(f.name) }
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
    if (!file) {
        ctx.status = 404;
        ctx.body = `File "${fileHash}" is not found`
        return;
    }

    if (isDownload) {
        ctx.response.set('Content-disposition', 'attachment; filename="' + slug(file.filename) + '"');
        ctx.body = fs.createReadStream(researchFilesPackageFilePath(rc.researchId, rc.hash, file.filename));
    } else {
        await send(ctx, `/files/${rc.researchId}/${rc.hash}/${file.filename}`);
    }
}

export default {
    // files
    uploadBulkResearchContent,
    getResearchPackageFile,

    // refs
    getContentRefById,
    getContentRefByHash,
    listContentRefs
}