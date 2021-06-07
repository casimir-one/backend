import sharp from 'sharp';
import { UserDtoService, UserService, AttributeDtoService } from './../../services';
import FileStorage from './../../storage';
import UserBookmarkService from './../../services/legacy/userBookmark';
import { USER_PROFILE_STATUS, ATTR_SCOPES, ATTRIBUTE_TYPE } from './../../constants';

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

const getAvatar = async (ctx) => {
  const username = ctx.params.username;
  const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
  const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
  const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
  const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

  try {

    const userDtoService = new UserDtoService();
    const attributeDtoService = new AttributeDtoService();
    const user = await userDtoService.getUser(username);
    const defaultAvatar = FileStorage.getAccountDefaultAvatarFilePath();

    let src;
    let buff;

    if (user && user.profile && user.profile.attributes) {
      // temp solution //
      const attrs = await attributeDtoService.getNetworkAttributesByScope(ATTR_SCOPES.USER);
      const attr = attrs.find(
        ({ type, title, tenantId }) => title === 'Avatar' && type === ATTRIBUTE_TYPE.IMAGE && tenantId === user.tenantId
      );
      const userAttr = user.profile.attributes.find(({ attributeId }) => attributeId.toString() === (attr ? attr._id.toString() : ''));
      const filepath = FileStorage.getAccountAvatarFilePath(user.account.name, userAttr ? userAttr.value : 'default');
      const exists = await FileStorage.exists(filepath);
      if (exists) {
        buff = await FileStorage.get(filepath);
      } else {
        src = defaultAvatar;
      }
    } else {
      src = defaultAvatar;
    }

    let resize = (w, h) => {
      return new Promise((resolve, reject) => {
        sharp.cache(!noCache);
        sharp(buff || src)
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
  addUserBookmark,
  removeUserBookmark,

  getAvatar,
  
}