import multer from 'koa-multer';
import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import UserProfile from './../schemas/user'
import config from './../config'

const filesStoragePath = path.join(__dirname, `./../${config.fileStorageDir}`);
const avatarsStoragePath = () => `${filesStoragePath}/avatars`
const avatarPath = (username) => `${avatarsStoragePath()}/${username}`

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
                .png()
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
    ctx.type = 'image/png';
    ctx.body = avatar;
}

export default {
    uploadAvatar,
    getAvatar
}