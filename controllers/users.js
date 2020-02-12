import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import config from './../config';
import UserBookmark from './../schemas/userBookmark';
import UserProfile from './../schemas/user';
import qs from 'qs';
import usersService from './../services/users';

const getUserProfile = async (ctx) => {
  try {
    const username = ctx.params.username;

    const profile = await UserProfile.findOne({ '_id': username })
    if (!profile) {
      ctx.status = 204;
      ctx.body = null;
      return;
    }

    ctx.status = 200;
    ctx.body = profile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getUsersProfiles = async (ctx) => {
  const query = qs.parse(ctx.query);
  const parsed = query.accounts || [];
  const accounts = [];

  try {

    if (Array.isArray(parsed)) {
      accounts.push(...parsed)
    } else if (typeof parsed === 'object' && parsed != null) {
      accounts.push(...Object.values(parsed))
    }

    const profiles = await UserProfile.find({ '_id': { $in: accounts } })

    ctx.status = 200;
    ctx.body = profiles;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const createUserProfile = async (ctx) => {
  const data = ctx.request.body;
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  try {

    if (username != jwtUsername) { // revise this once we've got 'approve' operation working
      ctx.status = 403;
      ctx.body = `You have no permission to create '${username}' profile`
      return;
    }

    const exists = await UserProfile.count({ '_id': username }) != 0;

    if (exists) {
      ctx.status = 409
      ctx.body = `Profile for "${username}" already exists!`
      return;
    }

    data._id = username;
    const profile = new UserProfile(data)
    const savedProfile = await profile.save()

    ctx.status = 200;
    ctx.body = savedProfile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const updateUserProfile = async (ctx) => {
  const data = ctx.request.body;
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  try {
    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to edit '${username}' profile`
      return;
    }

    const profile = await UserProfile.findOne({ '_id': username })
    if (!profile) {
      ctx.status = 404;
      ctx.body = `Profile for "${username}" does not exist!`
      return;
    }

    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        profile[key] = data[key]
      }
    }

    const updatedProfile = await profile.save()
    ctx.status = 200;
    ctx.body = updatedProfile
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getUserBookmarks = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  try {

    if (username !== jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to get '${username}' bookmarks`;
      return;
    }

    const query = { username, };
    if (ctx.query.type) {
      query.type = ctx.query.type;
    }
    if (ctx.query.ref) {
      query.ref = ctx.query.ref;
    }
    const bookmarks = await UserBookmark.find(query);

    ctx.status = 200;
    ctx.body = bookmarks;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const addUserBookmark = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;
  
  try {

    if (username !== jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to create '${username}' bookmarks`;
      return;
    }

    const data = ctx.request.body;
    const bookmarkType = data.type;
    let ref
    switch (bookmarkType) {
      case 'research':
        const researchId = +data.researchId;
        if (!Number.isInteger(researchId) || researchId < 0) {
          ctx.status = 400;
          ctx.body = 'Invalid researchId value';
          return;
        }
        ref = data.researchId;
        break;
    }

    const bookmark = new UserBookmark({
      username,
      type: data.type,
      ref,
    });
    const savedBookmark = await bookmark.save();

    ctx.status = 201;
    ctx.body = savedBookmark;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const removeUserBookmark = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  try {
    if (username !== jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to remove '${username}' bookmarks`;
      return;
    }

    await UserBookmark.remove({
      _id: ctx.params.bookmarkId,
      username,
    });
    ctx.status = 204;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const filesStoragePath = path.join(__dirname, `./../${config.fileStorageDir}`);
const accountsStoragePath = (username) => `${filesStoragePath}/accounts/${username}`;
const avatarPath = (username, picture) => `${accountsStoragePath(username)}/${picture}`;
const defaultAvatarPath = () => path.join(__dirname, `./../default/default-avatar.png`);

const allowedAvatarMimeTypes = ['image/png', 'image/jpeg']
const avatarStorage = multer.diskStorage({
  destination: async function (req, file, callback) {
    const ensureDir = util.promisify(fsExtra.ensureDir);
    await ensureDir(accountsStoragePath(req.headers['username']));
    const dest = accountsStoragePath(req.headers['username']);
    callback(null, dest)
  },
  filename: function (req, file, callback) {
    let ext = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
    callback(null, `${req.headers['username']}.${ext}`);
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
  
  try {

    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to upload avatar for '${username}' profile`;
      return;
    }

    const profile = await usersService.findUserProfileByOwner(username);
    if (!profile) {
      ctx.status = 404;
      ctx.body = `Profile for "${username}" does not exist!`;
      return;
    }

    const oldFilename = profile.avatar;
    const userAvatar = avatarUploader.single('user-avatar');
    const { filename } = await userAvatar(ctx, () => new Promise((resolve, reject) => {
      resolve({ 'filename': ctx.req.file.filename });
    }));

    profile.avatar = filename;
    const updatedProfile = await profile.save();

    if (oldFilename != filename) {
      const unlink = util.promisify(fs.unlink);
      await unlink(avatarPath(username, oldFilename));
    }

    ctx.status = 200;
    ctx.body = updatedProfile;

  } catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAvatar = async (ctx) => {
  const username = ctx.params.username;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  try {

    let profile = await usersService.findUserProfileByOwner(username);
    let src = avatarPath(username, profile.avatar);

    try {

      const stat = util.promisify(fs.stat);
      const check = await stat(src);
    } catch (err) {
      src = defaultAvatarPath();
    }

    let resize = (w, h) => {
      return new Promise((resolve, reject) => {
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
            reject(err)
          });
      })
    }

    let avatar = await resize(width, height);

    if (isRound) {
      let round = (w) => {
        let r = w / 2;
        let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
        return new Promise((resolve, reject) => {
          avatar = sharp(avatar)
            .overlayWith(circleShape, { cutout: true })
            .png()
            .toBuffer()
            .then(data => {
              resolve(data)
            })
            .catch(err => {
              reject(err)
            });
        });
      }

      avatar = await round(width);
    }

    ctx.type = 'image/png';
    ctx.body = avatar;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


export default {
  getUserProfile,
  getUsersProfiles,
  createUserProfile,
  updateUserProfile,

  getUserBookmarks,
  addUserBookmark,
  removeUserBookmark,

  uploadAvatar,
  getAvatar
}