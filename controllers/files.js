import multer from 'koa-multer';
import md5File from 'md5-file';
import fs from 'fs';
import util from 'util';
import path from 'path';
import send from 'koa-send';
import sharp from 'sharp'
import UserProfile from './../schemas/user'
import ResearchContent from './../schemas/researchContent'

const filesStoragePath = path.join(__dirname, './../files/');
const researchStoragePath = (researchId) => { return filesStoragePath + researchId; }
const researchContentPath = (researchId, filename) => { return researchStoragePath(researchId) + '/' + filename }

const contentStorage = multer.diskStorage({
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

const uploadContent = async(ctx) => {

    const researchId = ctx.request.header['research-id'];
    if (!researchId || isNaN(parseInt(researchId))) {
        ctx.status = 400;
        ctx.body = { error: `"Research-Id" header is required` };
        return;
    }

    const researchContent = contentUploader.single('research-content');
    const result = await researchContent(ctx, () => new Promise((resolve) => {

        md5File(researchContentPath(researchId, ctx.req.file.filename), async(err, md5Hash) => {
            if (err) {
                resolve({ error: err.message })
            }
            // we should use composite key as several research 
            // may upload the same file - for example raw data set
            const _id = `${researchId}_${md5Hash}`;

            const content = await ResearchContent.findOne({_id: _id});

            if (content != null) {
                console.log(`File with ${md5Hash} hash already exists! Removing uploaded file...`);
                fs.unlinkSync(researchContentPath(researchId, ctx.req.file.filename));
                resolve({ hash: md5Hash })
            } else {
                const rc = new ResearchContent({
                    "_id": _id,
                    "filename": ctx.req.file.filename,
                    "research": researchId
                });
                const savedResearchContent = await rc.save();
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

    const content = await ResearchContent.findOne({ '_id': `${researchId}_${hash}` });

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

const avatarsStoragePath = () => { return filesStoragePath + 'avatars'; }
const avatarPath = (username) => { return avatarsStoragePath() + '/' + username }

const allowedAvatarMimeTypes = ['image/png', 'image/jpeg']
const avatarStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        const dest = avatarsStoragePath()
        callback(null, dest)
    },
    filename: function(req, file, callback) {
        callback(null, `${req.headers['username']}-${file.originalname}`);
    }
})

const avatarUploader = multer({
    storage: avatarStorage,
    fileFilter: function(req, file, callback) {
        if (allowedAvatarMimeTypes.find(mime => mime === file.mimetype) === undefined) {
            return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
        }
        callback(null, true);
    }
})


const uploadAvatar = async(ctx) => {
    const username = ctx.request.header['username'];
    const jwtUsername = ctx.state.user.username;

    if (username != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You have no permission to upload avatar for '${username}' profile`
        return;
    }

    const profile = await UserProfile.findOne({'_id': username})

    if (!profile) {
        ctx.status = 404;
        ctx.body = `Profile for "${username}" does not exist!`
        return;
    }

    const oldAvatar = profile.avatar; 

    const userAvatar = avatarUploader.single('user-avatar');
    const result = await userAvatar(ctx, () => new Promise((resolve) => {
        resolve({'filename': ctx.req.file.filename});
    }));

    profile.avatar = result.filename;
    const updatedProfile = await profile.save();

    if (!updatedProfile) {
        ctx.status = 500;
        ctx.body = 'An error occurred while processing image, please try again later';
        return;
    }

    if (oldAvatar && oldAvatar != 'default_avatar.png' && fs.existsSync(avatarPath(oldAvatar))) {
        fs.unlinkSync(avatarPath(oldAvatar))
    }

    ctx.status = 200;
    ctx.body = updatedProfile;
}

const getAvatar = async (ctx) => {
    const picture = ctx.params.picture;
    const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
    const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
    const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;

    var src = avatarPath(picture);
    const stat = util.promisify(fs.stat);

    try {
        const check = await stat(src);
    } catch(err) {
        src = avatarPath("default_avatar.png");
    }

    const resize = (w, h) => {
        return new Promise((resolve) => {
            sharp.cache(!noCache);
            sharp(src)
                .rotate()
                .resize(w, h)
                .jpeg()
                .toBuffer()
                .then(data => {
                    resolve(data)
                })
                .catch(err => {
                    resolve(err)
                });
            })
    }

    const avatar = await resize(width, height);
    ctx.type = 'image/jpeg';
    ctx.body = avatar;
}

export default {
    uploadContent,
    getContent,
    uploadAvatar,
    getAvatar
}