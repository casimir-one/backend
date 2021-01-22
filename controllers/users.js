import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra';
import util from 'util';
import path from 'path';
import sharp from 'sharp';
import config from './../config';
import qs from 'qs';
import UserService from './../services/users';
import UserBookmarkService from './../services/userBookmark';
import * as blockchainService from './../utils/blockchain';
import { USER_PROFILE_STATUS } from './../constants';


const getUser = async (ctx) => {
  const username = ctx.params.username;

  try {

    const usersService = new UserService();
    const user = await usersService.getUser(username);
    if (!user) {
      ctx.status = 204;
      ctx.body = null;
      return;
    }

    ctx.status = 200;
    ctx.body = user;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getUsers = async (ctx) => {
  const query = qs.parse(ctx.query);
  const usernames = query.usernames;

  try {
    const usersService = new UserService();
    const users = await usersService.getUsers(usernames);
    ctx.status = 200;
    ctx.body = users;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getUserByEmail = async (ctx) => {
  const email = ctx.params.email;

  try {
    const usersService = new UserService();
    const user = await usersService.getUserByEmail(email);
    if (!user) {
      ctx.status = 204;
      ctx.body = null;
      return;
    }

    ctx.status = 200;
    ctx.body = user;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getUserProfile = async (ctx) => {
  const username = ctx.params.username;

  try {
    const usersService = new UserService();
    const userProfile = await usersService.findUserProfileByOwner(username);
    if (!userProfile) {
      ctx.status = 204;
      ctx.body = null;
      return;
    }

    ctx.status = 200;
    ctx.body = userProfile;

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
    const usersService = new UserService();

    if (Array.isArray(parsed)) {
      accounts.push(...parsed)
    } else if (typeof parsed === 'object' && parsed != null) {
      accounts.push(...Object.values(parsed))
    }

    const usersProfiles = await usersService.findUserProfiles(accounts);
    
    ctx.status = 200;
    ctx.body = usersProfiles;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getActiveUsersProfiles = async (ctx) => {

  try {
    const usersService = new UserService();
    const activeUsersProfiles = await usersService.findUserProfilesByStatus(USER_PROFILE_STATUS.APPROVED);
    ctx.status = 200;
    ctx.body = activeUsersProfiles;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const updateUserProfile = async (ctx) => {
  const update = ctx.request.body;
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  try {

    const usersService = new UserService();
    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to edit '${username}' profile`
      return;
    }

    const userProfile = await usersService.findUserProfileByOwner(username);
    if (!userProfile) {
      ctx.status = 404;
      ctx.body = `Profile for '${username}' does not exist`
      return;
    }

    const updatedUserProfile = await usersService.updateUserProfile(username, { ...update });

    ctx.status = 200;
    ctx.body = updatedUserProfile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const updateUserAccount = async (ctx) => {
  const { tx } = ctx.request.body;
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  try {

    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to edit '${username}' account`
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);
    ctx.status = 200;
    ctx.body = { txResult };

    ctx.status = 200;
    ctx.body = {}
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getUserBookmarks = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;
  const type = ctx.query.type;
  const ref = ctx.query.ref;

  try {

    const userBookmarkService = new UserBookmarkService();
    
    if (username !== jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to get '${username}' bookmarks`;
      return;
    }

    const bookmarks = await userBookmarkService.getUserBookmarks(username, type, ref);
    ctx.status = 200;
    ctx.body = bookmarks;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getUsersByResearchGroup = async (ctx) => {
  const researchGroupExternalId = ctx.params.researchGroupExternalId;
  try {
    const usersService = new UserService();
    const members = await usersService.getUsersByResearchGroup(researchGroupExternalId);
    ctx.status = 200;
    ctx.body = members;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const addUserBookmark = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;
  
  try {

    const userBookmarkService = new UserBookmarkService();
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
        ref = data.researchId;
        break;
    }
    
    const bookmark = await userBookmarkService.createUserBookmark({
      username,
      type: data.type,
      ref
    });
    
    ctx.status = 201;
    ctx.body = bookmark;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const removeUserBookmark = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;
  const bookmarkId = ctx.params.bookmarkId;

  try {

    const userBookmarkService = new UserBookmarkService();
    if (username !== jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to remove '${username}' bookmarks`;
      return;
    }

    await userBookmarkService.removeUserBookmark(bookmarkId);
    ctx.status = 204;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const filesStoragePath = path.join(__dirname, `./../${config.FILE_STORAGE_DIR}`);
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

    const usersService = new UserService();
    if (username != jwtUsername) {
      ctx.status = 403;
      ctx.body = `You have no permission to upload avatar for '${username}' profile`;
      return;
    }

    const userProfile = await usersService.findUserProfileByOwner(username);
    if (!userProfile) {
      ctx.status = 404;
      ctx.body = `Profile for "${username}" does not exist!`;
      return;
    }

    const stat = util.promisify(fs.stat);
    const unlink = util.promisify(fs.unlink);
    const ensureDir = util.promisify(fsExtra.ensureDir);

    try {
      const filepath = accountsStoragePath(username);
      await stat(filepath);
      await unlink(filepath);
    } catch (err) {
      await ensureDir(accountsStoragePath(username))
    }

    const oldFilename = userProfile.avatar;
    const userAvatar = avatarUploader.single('user-avatar');
    const { filename } = await userAvatar(ctx, () => new Promise((resolve, reject) => {
      resolve({ 'filename': ctx.req.file.filename });
    }));

    const updatedUserProfile = await usersService.updateUserProfile(username, { avatar: filename });


    if (oldFilename != filename) {
      try {
        await unlink(avatarPath(username, oldFilename));
      } catch(err) {}
    }

    ctx.status = 200;
    ctx.body = updatedUserProfile;

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

    const usersService = new UserService();
    const user = await usersService.getUser(username);
    let src = user && user.profile ? avatarPath(user.account.name, user.profile.avatar) : defaultAvatarPath();

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
  getUser,
  getUsers,
  getUserByEmail,
  getUsersByResearchGroup,

  getUserProfile,
  getUsersProfiles,
  getActiveUsersProfiles,
  updateUserProfile,
  updateUserAccount,

  getUserBookmarks,
  addUserBookmark,
  removeUserBookmark,

  uploadAvatar,
  getAvatar
  
}