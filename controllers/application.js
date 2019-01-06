import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import multer from 'koa-multer';
import deipRpc from '@deip/deip-rpc-client';
import ApplicationContent from './../schemas/applicationContent';
import { hashElement } from 'folder-hash';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findApplicationByHashOrId, findApplicationPackageByHashOrId } from './../services/applicationContent';
import { authorizeResearchGroup } from './../services/auth';
import { bulkApplicationContentUploader } from './../storages/bulkApplicationContentUploader';
import crypto from 'crypto';
import rimraf from "rimraf";

const storagePath = path.join(__dirname, './../files');
const opts = {}

const listApplicationsRefsByResearch = async (ctx) => {
    const researchId = ctx.params.researchId;
    try {
        const applications = await ApplicationContent.find({'researchId': researchId });
        ctx.status = 200;
        ctx.body = applications;
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const listApplicationsRefsByFoa = async (ctx) => {
    const foaId = ctx.params.foaId;
    try {
        const applications = await ApplicationContent.find({'foaId': foaId });
        ctx.status = 200;
        ctx.body = applications;
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const getApplicationRef = async (ctx) => {
    const hashOrId = ctx.params.hashOrId;
    try {
        const application = await findApplicationByHashOrId(hashOrId);
        ctx.status = 200;
        ctx.body = application;
    } catch (err){
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


// ############# files ######################
const agencyStoragePath = (agency) => `${storagePath}/agencies/${agency}`
const agencyApplicationsStoragePath = (agency) => `${agencyStoragePath(agency)}/applications`
const agencyApplicationSingleFileContentPath = (agency, packageHash) => `${agencyApplicationsStoragePath(agency)}/${packageHash}`
const agencyFoaApplicationPackagePath = (agency, foaId, packageHash) => `${agencyApplicationsStoragePath(agency)}/foa-${foaId}/${packageHash}`
const agencyFoaApplicationPackageFormPath = (agency, foaId, packageHash, formHash) => `${agencyFoaApplicationPackagePath(agency, foaId, packageHash)}/${formHash}`
const agencyTempStoragePath = (agency, postfix) => `${storagePath}/agencies/${agency}/temp-${postfix}`

const contentStorage = multer.diskStorage({
    destination: async function(req, file, callback) {

        const stat = util.promisify(fs.stat);
        const mkdir = util.promisify(fs.mkdir);

        const agencyStorage = agencyStoragePath(req.headers['agency']);
        try {
            const check = await stat(agencyStorage);
        } catch(err) {
            await mkdir(agencyStorage);
        }

        const agencyFileStorage = agencyApplicationsStoragePath(req.headers['agency'])
        try {
            const check = await stat(agencyFileStorage);
        } catch(err) {
            await mkdir(agencyFileStorage);
        }

        callback(null, agencyFileStorage);
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

const uploadApplicationContent = async(ctx) => {
    const jwtUsername = ctx.state.user.username;

    const agency = ctx.request.header['agency'];
    const researchId = ctx.request.header['research-id'];
    const foaId = ctx.request.header['foa-id'];

    if (!agency || !researchId || isNaN(parseInt(researchId)) || !foaId || isNaN(parseInt(foaId))) {
        ctx.status = 400;
        ctx.body = { error: `"Agency", "Research-Id" and "Foa-Id" headers are required` };
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

        const applicationContent = contentUploader.single('application-content');
        const filepath = await applicationContent(ctx, () => new Promise((resolve, reject) => {
            fs.stat(agencyApplicationSingleFileContentPath(agency, ctx.req.file.filename), (err, stats) => {
                if (err || !stats.isFile()) {
                    console.error(err);
                    reject(err)
                }
                else {
                    resolve(agencyApplicationSingleFileContentPath(agency, ctx.req.file.filename));
                }
            });
        }));

        const options = { algo: 'md5', encoding: 'hex', files: { ignoreRootName: true }};
        const hashObj = await hashElement(filepath, options);

        var exists = false;
        const _id = `${agency}_application_${hashObj.hash}`;
        const ac = await findApplicationByHashOrId(_id);

        if (ac) {
            const stat = util.promisify(fs.stat);
            try {
                const check = await stat(agencyApplicationSingleFileContentPath(agency, ac.filename));
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
            ctx.body = ac;
        } else {

            if (ac) {
                ac.filename = hashObj.name
                const updatedAc = await rc.save();
                ctx.status = 200;
                ctx.body = updatedAc;
            } else {
                const ac = new ApplicationContent({
                    "_id": _id,
                    "filename": hashObj.name,
                    "agency": agency,
                    "title": hashObj.name,
                    "researchId": researchId,
                    "researchGroupId": research.research_group_id,
                    "foaId": foaId,
                    "hash": hashObj.hash,
                    "type": 'file',
                    "authors": [jwtUsername],
                });
                const savedAc = await ac.save();
                ctx.status = 200;
                ctx.body = savedAc;
            }
        }

    } catch(err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
    }
}

const uploadBulkApplicationContent = async(ctx) => {
    const jwtUsername = ctx.state.user.username;
    const agency = ctx.request.header['agency'];
    const researchId = ctx.request.header['research-id'];
    const foaId = ctx.request.header['foa-id'];

    if (!agency || !researchId || isNaN(parseInt(researchId)) || !foaId || isNaN(parseInt(foaId))) {
        ctx.status = 400;
        ctx.body = { error: `"Agency", "Research-Id" and "Foa-Id" headers are required` };
        return;
    }

    const stat = util.promisify(fs.stat);
    const mkdir = util.promisify(fs.mkdir);

    try {
        const agencyTempContentStorage = agencyTempStoragePath(ctx.request.header['agency'], ctx.request.header['upload-session'])
        try {
            const check = await stat(agencyTempContentStorage);
        } catch(err) {
            await mkdir(agencyTempContentStorage);
        }

        const research = await deipRpc.api.getResearchByIdAsync(researchId);
        const authorized = await authorizeResearchGroup(research.research_group_id, jwtUsername)
        if (!authorized) {
            ctx.status = 401;
            ctx.body = `"${jwtUsername}" is not permitted to edit "${researchId}" research`;
            return;
        }
    
        const applicationContent = bulkApplicationContentUploader.any();
        const tempDestinationPath = await applicationContent(ctx, () => new Promise((resolve, reject) => {
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
        const hashes = hashObj.children.map(f => f.name);
        hashes.sort();
        const hash = crypto.createHash('md5').update(hashes.join(",")).digest("hex");

        var exists = false;
        const ac = await findApplicationPackageByHashOrId(agency, foaId, hash);
        const packagePath = agencyFoaApplicationPackagePath(agency, foaId, hash);

        if (ac) {
            try {
                const check = await stat(packagePath);
                exists = true;
            } catch(err) {
                exists = false;
            }
        }
        
        if (exists) {
            console.log(`Folder with ${hash} hash already exists! Removing the uploaded files...`);
            rimraf(tempDestinationPath, function () { console.log(`${tempDestinationPath} removed`); });
            ctx.status = 200;
            ctx.body = ac;
        } else {

            await fsExtra.move(tempDestinationPath, packagePath);
            
            if (ac) {
                ac.filename = `package ${hash}`
                const updatedAc = await ac.save();
                ctx.status = 200;
                ctx.body = updatedAc;
            } else {
                const _id = `${agency}_${foaId}_${hash}`;
                const ac = new ApplicationContent({
                    "_id": _id,
                    "filename": `package ${hash}`,
                    "agency": agency,
                    "title": `package ${hash}`,
                    "researchId": researchId,
                    "researchGroupId": research.research_group_id,
                    "foaId": foaId,
                    "hash": hash,
                    "type": 'package',
                    "authors": [jwtUsername],
                    "packageForms": hashObj.children.map((f) => {
                        return { filename: f.name, hash: f.hash }
                    })
                });
                const savedAc = await ac.save();
                ctx.status = 200;
                ctx.body = savedAc;
            }
        }

    } catch(err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
    }
}

const getApplicationContent = async function(ctx) {
    const agency = ctx.params.agency;
    const hashOrId = ctx.params.hashOrId;
    const isDownload = ctx.query.download;

    const ac =  await findApplicationByHashOrId(hashOrId);;

    if (ac == null) {
        ctx.status = 404;
        ctx.body = `Content "${hashOrId}" is not found`
        return;
    }

    if (isDownload) {
        ctx.response.set('Content-disposition', 'attachment; filename="' + ac.filename + '"');
        ctx.body = fs.createReadStream(agencyApplicationSingleFileContentPath(agency, ac.filename));
    } else {
        await send(ctx, `/files/agencies/${agency}/applications/${ac.filename}`);
    }
}

const getApplicationPackageFormContent = async function(ctx) {
    const agency = ctx.params.agency;
    const hashOrId = ctx.params.hashOrId;
    const foaId = ctx.params.foaId;
    const formHash = ctx.params.formHash;
    const isDownload = ctx.query.download;

    const ac = await findApplicationPackageByHashOrId(agency, foaId, hashOrId);

    if (ac == null) {
        ctx.status = 404;
        ctx.body = `Package "${hashOrId}" is not found`
        return;
    }

    const form = ac.packageForms.find(f => f.hash == formHash);
    if (isDownload) {
        ctx.response.set('Content-disposition', 'attachment; filename="' + form.filename + '"');
        ctx.body = fs.createReadStream(agencyFoaApplicationPackageFormPath(ac.agency, ac.foaId, ac.hash, form.filename));
    } else {
        await send(ctx, `/files/agencies/${ac.agency}/applications/foa-${ac.foaId}/${ac.hash}/${form.filename}`);
    }
}



export default {
    // files
    uploadApplicationContent,
    uploadBulkApplicationContent,
    getApplicationContent,
    getApplicationPackageFormContent,

    // refs
    getApplicationRef,
    listApplicationsRefsByResearch,
    listApplicationsRefsByFoa
}