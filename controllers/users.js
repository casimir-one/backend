import multer from 'koa-multer';
import fs from 'fs';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import UserProfile from './../schemas/user';
import usersService from './../services/users';
import qs from 'qs';

const getUserProfile = async (ctx) => {
    const username = ctx.params.username;
    const profile = await UserProfile.findOne({'_id': username})

    if (!profile) {
        ctx.status = 204;
        ctx.body = null;
        return;
    }

    ctx.status = 200;
    ctx.body = profile;
}

const getUsersProfiles = async (ctx) => {
    const query = qs.parse(ctx.query);
    const parsed = query.accounts || [];
    const accounts = [];

    if(Array.isArray(parsed)) {
        accounts.push(...parsed)
    } else if (typeof parsed === 'object' && parsed != null) {
        accounts.push(...Object.values(parsed))
    }

    const profiles = await UserProfile.find({'_id': { $in: accounts }})

    ctx.status = 200;
    ctx.body = profiles;
}

const createUserProfile = async (ctx) => {
    const data = ctx.request.body;
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;

    if (username != jwtUsername) { // revise this once we've got 'approve' operation working
        ctx.status = 403;
        ctx.body = `You have no permission to create '${username}' profile`
        return;
    }
    
    const exists = await UserProfile.count({'_id': username}) != 0;

    if (exists) {
        ctx.status = 409
        ctx.body = `Profile for "${username}" already exists!`
        return;
    }

    data._id = username;
    const profile = new UserProfile(data)
    const savedProfile = await profile.save()

    ctx.status = 200
    ctx.body = savedProfile
}

const ALLOWED_TO_UPDATE = [
  'email', 'activeOrgPermlink', 'avatar', 'firstName', 'lastName',
  'bio', 'birthday', 'location'
];
const updateUserProfile = async (ctx) => {
    const data = ctx.request.body;
    const username = ctx.params.username;
    const jwtUsername = ctx.state.user.username;

    if (username != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You have no permission to edit '${username}' profile`
        return;
    }

    const dataToUpdate = {};
    for (let key in data) {
      if (ALLOWED_TO_UPDATE.includes(key)) {
        dataToUpdate[key] = data[key];
      }
    }
    const updatedProfile = await usersService.updateProfile(username, dataToUpdate);
    if (!updatedProfile) {
      ctx.status = 404;
      ctx.body = `Profile for "${username}" does not exist!`
      return;
    }

    ctx.status = 200;
    ctx.body = updatedProfile
}


const filesStoragePath = path.join(__dirname, './../files');
const avatarsStoragePath = () => `${filesStoragePath}/avatars`
const avatarPath = (username) => `${avatarsStoragePath()}/${username}`

const allowedAvatarMimeTypes = ['image/png', 'image/jpeg']
const avatarStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        const dest = avatarsStoragePath()
        callback(null, dest)
    },
    filename: function (req, file, callback) {
        callback(null, `${req.headers['username']}-${file.originalname}`);
    }
})

const avatarUploader = multer({
    storage: avatarStorage,
    fileFilter: function (req, file, callback) {
        if (allowedAvatarMimeTypes.find(mime => mime === file.mimetype) === undefined) {
            return callback(new Error('Only the following mime types are allowed: ' + allowedAvatarMimeTypes.join(', ')), false);
        }
        callback(null, true);
    }
})


const uploadAvatar = async (ctx) => {
    const username = ctx.request.header['username'];
    const jwtUsername = ctx.state.user.username;

    if (username != jwtUsername) {
        ctx.status = 403;
        ctx.body = `You have no permission to upload avatar for '${username}' profile`
        return;
    }

    const profile = await UserProfile.findOne({ '_id': username })

    if (!profile) {
        ctx.status = 404;
        ctx.body = `Profile for "${username}" does not exist!`
        return;
    }

    const oldAvatar = profile.avatar;

    const userAvatar = avatarUploader.single('user-avatar');
    const result = await userAvatar(ctx, () => new Promise((resolve) => {
        resolve({ 'filename': ctx.req.file.filename });
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
    } catch (err) {
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
    getUserProfile,
    getUsersProfiles,
    createUserProfile,
    updateUserProfile,
    uploadAvatar,
    getAvatar
}