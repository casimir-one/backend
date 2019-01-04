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
import { findApplicationByHashOrId } from './../services/applicationContent';
import { authorizeResearchGroup } from './../services/auth'
import url from 'url';

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
        const draft = await findContentByHashOrId(hashOrId);
        ctx.status = 200;
        ctx.body = draft;
    } catch (err){
        ctx.status = 500;
        ctx.body = err.message;
    }
}


// ############# files ######################
const agencyStoragePath = (agency) => `${storagePath}/agencies/${agency}`
const agencyApplicationsStoragePath = (agency) => `${agencyStoragePath(agency)}/applications`
const agencyApplicationFileContentPath = (agency, filename) => `${agencyApplicationsStoragePath(agency)}/${filename}`

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
            fs.stat(agencyApplicationFileContentPath(agency, ctx.req.file.filename), (err, stats) => {
                if (err || !stats.isFile()) {
                    console.error(err);
                    reject(err)
                }
                else {
                    resolve(agencyApplicationFileContentPath(agency, ctx.req.file.filename));
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
                const check = await stat(agencyApplicationFileContentPath(agency, ac.filename));
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
        ctx.body = fs.createReadStream(agencyApplicationFileContentPath(agency, ac.filename));
    } else {
        await send(ctx, `/files/agencies/${agency}/applications/${ac.filename}`);
    }
}


export default {
    // files
    uploadApplicationContent,
    getApplicationContent,

    // refs
    getApplicationRef,
    listApplicationsRefsByResearch,
    listApplicationsRefsByFoa
}