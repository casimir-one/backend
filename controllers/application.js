import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import util from 'util';
import send from 'koa-send';
import multer from 'koa-multer';
import deipRpc from '@deip/deip-oa-rpc-client';
import ApplicationContent from './../schemas/applicationContent';
import { hashElement } from 'folder-hash';
import config from './../config';
import { sendTransaction } from './../utils/blockchain';
import { findApplicationPackageByHash } from './../services/applicationContent';
import { authorizeResearchGroup } from './../services/auth';
import { bulkApplicationContentUploader } from './../storages/bulkApplicationContentUploader';
import crypto from 'crypto';
import rimraf from "rimraf";

const storagePath = path.join(__dirname, `./../${config.fileStorageDir}`);
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
        const applications = await ApplicationContent.find({ 'foaId': foaId });
        ctx.status = 200;
        ctx.body = applications;
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}

const getApplicationPackageRef = async (ctx) => {
    const agency = ctx.params.agency;
    const foaId = ctx.params.foaId;
    const hash = ctx.params.hash;
    try {
        const application = await findApplicationPackageByHash(agency, foaId, hash);
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
const agencyFoaApplicationPackagePath = (agency, foaId, packageHash) => `${agencyApplicationsStoragePath(agency)}/foa-${foaId}/${packageHash}`
const agencyFoaApplicationPackageFormPath = (agency, foaId, packageHash, formHash) => `${agencyFoaApplicationPackagePath(agency, foaId, packageHash)}/${formHash}`
const agencyTempStoragePath = (agency, postfix) => `${storagePath}/agencies/${agency}/temp-${postfix}`

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
        console.log(hashObj);
        const letterHash = hashObj.children[0].hash;
        const hashes = hashObj.children.map(f => f.hash);
        hashes.sort();
        const packageHash = crypto.createHash('md5').update(hashes.join(",")).digest("hex");

        var exists = false;
        const ac = await findApplicationPackageByHash(agency, foaId, packageHash);
        const packagePath = agencyFoaApplicationPackagePath(agency, foaId, packageHash);

        if (ac) {
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
            ctx.body = ac;
        } else {

            await fsExtra.move(tempDestinationPath, packagePath, { overwrite: true });
            
            if (ac) {
                ac.filename = `Package: application [${letterHash}]; forms [${packageHash}];'`
                const updatedAc = await ac.save();
                ctx.status = 200;
                ctx.body = updatedAc;
            } else {
                const ac = new ApplicationContent({
                    "filename": `Package: application [${letterHash}]; forms [${packageHash}];'`,
                    "agency": agency,
                    "title": `package ${packageHash}`,
                    "researchId": researchId,
                    "researchGroupId": research.research_group_id,
                    "foaId": foaId,
                    "letterHash": letterHash,
                    "hash": packageHash,
                    "status": "pending",
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

const getApplicationPackageFormContent = async function(ctx) {
    const agency = ctx.params.agency;
    const hash = ctx.params.hash;
    const foaId = ctx.params.foaId;
    const formHash = ctx.params.formHash;
    const isDownload = ctx.query.download;

    const ac = await findApplicationPackageByHash(agency, foaId, hash);

    if (ac == null) {
        ctx.status = 404;
        ctx.body = `Package "${hash}" is not found`
        return;
    }

    const form = ac.packageForms.find(f => f.hash == formHash);
    if (isDownload) {
        ctx.response.set('Content-disposition', 'attachment; filename="' + form.filename + '"');
        ctx.body = fs.createReadStream(agencyFoaApplicationPackageFormPath(ac.agency, ac.foaId, ac.hash, form.filename));
    } else {
        await send(ctx, `/${config.fileStorageDir}/agencies/${ac.agency}/applications/foa-${ac.foaId}/${ac.hash}/${form.filename}`);
    }
}



export default {
    // files
    uploadBulkApplicationContent,
    getApplicationPackageFormContent,

    // refs
    getApplicationPackageRef,
    listApplicationsRefsByResearch,
    listApplicationsRefsByFoa
}