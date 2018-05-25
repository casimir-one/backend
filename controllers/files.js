import multer from 'koa-multer';
import md5File from 'md5-file';
import fs from 'fs';
import path from 'path';
import ContentService from '../services/content.js';
import send from 'koa-send';

const basePath = path.join(__dirname, './../files/');
const researchStoragePath = (researchId) => { return basePath + researchId; }
const researchContentPath = (researchId, filename) => { return researchStoragePath(researchId) + '/' + filename }

const storage = multer.diskStorage({
    destination: function(req, file, callback) {
        const dest = researchStoragePath(req.headers['research-id'])
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }
        callback(null, dest)
    },
    filename: function(req, file, callback) {
        callback(null, (new Date).getTime() + '_' + file.originalname);
    }
})

const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg']
const uploader = multer({
    storage: storage,
    fileFilter: function(req, file, callback) {
        if (allowedMimeTypes.find(mime => mime === file.mimetype) === undefined) {
            return callback(new Error('Only the following mime types are allowed: ' + allowedMimeTypes.join(', ')), false);
        }
        callback(null, true);
    }
})

const uploadContent = async(ctx) => {

    const researchId = ctx.request.header['research-id'];
    if (!researchId || isNaN(parseInt(researchId))) {
        ctx.status = 400;
        ctx.body = { error: `"Research-Id" header is required` };
        return;
    }

    const researchContent = uploader.single('research-content');
    const result = await researchContent(ctx, () => new Promise((resolve) => {

        md5File(researchContentPath(researchId, ctx.req.file.filename), async(err, md5Hash) => {
            if (err) {
                resolve({ error: err.message })
            }
            // we should use composite key as several research 
            // may upload the same file - for example raw data set
            const _id = `${researchId}_${md5Hash}`;

            let contentService = new ContentService();
            const count = await contentService.count(_id);

            if (count != 0) {
                console.log(`File with ${md5Hash} hash already exists! Removing uploaded file...`);
                fs.unlinkSync(researchContentPath(researchId, ctx.req.file.filename));
                resolve({ hash: md5Hash })
            } else {
                const rc = {
                    "_id": _id,
                    "filename": ctx.req.file.filename,
                    "research": researchId
                };
                const result = await contentService.create(rc);
                resolve({ hash: md5Hash })
            }
        })
    }));

    if (result.hash) {
        ctx.status = 200;
    } else {
        ctx.status = 500;
    }

    ctx.body = result;
}


const getContent = async function(ctx) {
    const researchId = ctx.params.researchId;
    const hash = ctx.params.hash;
    const isDownload = ctx.query.download;

    let contentService = new ContentService();
    const content = await contentService.findOne(researchId, hash);

    if (content == null) {
        ctx.status = 404;
        ctx.body = `Content "${hash}" is not found`
        return;
    }

    if (isDownload) {
        ctx.response.set('Content-disposition', 'attachment; filename="' + content.filename + '"');
        ctx.body = fs.createReadStream(researchContentPath(researchId, content.filename));
    } else {
        await send(ctx, `/files/${researchId}/${content.filename}`);
    }
}

export default {
    uploadContent,
    getContent
}