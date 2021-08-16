import BaseController from '../base/BaseController';
import {UserDtoService} from '../../services';
import sharp from 'sharp';
import qs from 'qs';
import FileStorage from './../../storage';
import slug from 'limax';
import UserBookmarkService from './../../services/legacy/userBookmark';
import { accountCmdHandler } from './../../command-handlers';
import { USER_PROFILE_STATUS } from './../../constants';
import { APP_CMD } from '@deip/constants';
import { UserForm } from './../../forms';

const userDtoService = new UserDtoService();

class UsersController extends BaseController {
  
  getUser = this.query({
    h: async (ctx) => {
      try {
        const username = ctx.params.username;
        const user = await userDtoService.getUser(username);
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
  });
  
  getUsers = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const usernames = query.usernames ? Object.values(query.usernames) : [];
        const users = await userDtoService.getUsers(usernames);
        ctx.status = 200;
        ctx.body = users;
    
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getUserByEmail = this.query({
    h: async (ctx) => {
      try {
        const email = ctx.params.email;
        const user = await userDtoService.getUserByEmail(email);
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
  });

  getUserProfile = this.query({
    h: async (ctx) => {
      try {
        const username = ctx.params.username;
        const userProfile = await userDtoService.findUserProfileByOwner(username);
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
  });

  getUsersProfiles = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const parsed = query.accounts || [];
        const accounts = [];
    
        if (Array.isArray(parsed)) {
          accounts.push(...parsed)
        } else if (typeof parsed === 'object' && parsed != null) {
          accounts.push(...Object.values(parsed))
        }
    
        const usersProfiles = await userDtoService.findUserProfiles(accounts);
        
        ctx.status = 200;
        ctx.body = usersProfiles;
    
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
      }
    }
  });

  getActiveUsersProfiles = this.query({
    h: async (ctx) => {
      try {
        const activeUsersProfiles = await userDtoService.findUserProfilesByStatus(USER_PROFILE_STATUS.APPROVED);
        ctx.status = 200;
        ctx.body = activeUsersProfiles;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getUserBookmarks = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const username = ctx.params.username;
        const type = ctx.query.type;
        const ref = ctx.query.ref;
    
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
  });

  getUsersByTeam = this.query({
    h: async (ctx) => {
      try {
        const teamId = ctx.params.teamId;
        const members = await userDtoService.getUsersByTeam(teamId);
        ctx.status = 200;
        ctx.body = members;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getUsersByTenant = this.query({
    h: async (ctx) => {
      try {
        const tenantId = ctx.params.tenantId;
        const users = await userDtoService.getUsersByTenant(tenantId);
        ctx.status = 200;
        ctx.body = users;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getUsersListing = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const users = await userDtoService.getUsersListing(query.status);
        ctx.status = 200;
        ctx.body = users;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getUserAttributeFile = this.query({
    h: async (ctx) => {
      try {
        const username = ctx.params.username;
        const attributeId = ctx.params.attributeId;
        const filename = ctx.params.filename;
      
        const isTeamRootFolder = username == attributeId;
        const filepath = isTeamRootFolder ? FileStorage.getAccountFilePath(username, filename) : FileStorage.getAccountAttributeFilePath(username, attributeId, filename);
        let buff = await FileStorage.get(filepath);
    
        const imageQuery = ctx.query.image === 'true';
        if (imageQuery) {
          const exists = await FileStorage.exists(filepath);
          if (!exists) {
            filepath = FileStorage.getAccountDefaultAvatarFilePath();
            buff = await FileStorage.get(filepath);
          }
    
          const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
          const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
          const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
          const isRound = ctx.query.round ? ctx.query.round === 'true' : false;
    
          const resize = (w, h) => {
            return new Promise((resolve) => {
              sharp.cache(!noCache);
              sharp(buff)
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
    
          let image = await resize(width, height);
          if (isRound) {
            let round = (w) => {
              let r = w / 2;
              let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
              return new Promise((resolve, reject) => {
                image = sharp(image)
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
    
            image = await round(width);
          }
    
          ctx.type = 'image/png';
          ctx.status = 200;
          ctx.body = image;
    
        } else {
    
          const isDownload = ctx.query.download === 'true';
    
          const ext = filename.substr(filename.lastIndexOf('.') + 1);
          const name = filename.substr(0, filename.lastIndexOf('.'));
          const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
          const isPdf = ['pdf'].some(e => e == ext);
    
          if (isDownload) {
            ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          } else if (isImage) {
            ctx.response.set('Content-Type', `image/${ext}`);
            ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          } else if (isPdf) {
            ctx.response.set('Content-Type', `application/${ext}`);
            ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          } else {
            ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          }
        }
    
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  updateUser = this.command({
    form: UserForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if(appCmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT) {
            const {isTeamAccount} = appCmd.getCmdPayload();
            if(isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for user account`);
            }
          }
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT);
        const entityId = appCmd.getCmdPayload().entityId;

        ctx.status = 200;
        ctx.body = { entityId };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
}

const usersCtrl = new UsersController();

module.exports = usersCtrl;