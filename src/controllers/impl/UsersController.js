import BaseController from '../base/BaseController';
import { UserDtoService, AttributeDtoService, UserService } from '../../services';
import sharp from 'sharp';
import qs from 'qs';
import config from '../../config';
import FileStorage from './../../storage';
import UserBookmarkService from './../../services/legacy/userBookmark';
import { accountCmdHandler, assetCmdHandler } from './../../command-handlers';
import { USER_PROFILE_STATUS, USER_ROLES } from './../../constants';
import { APP_CMD, ATTR_SCOPES, ATTR_TYPES, PROTOCOL_CHAIN } from '@deip/constants';
import { UserForm } from './../../forms';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from './../../errors';
import { ChainService, SubstrateChainUtils } from '@deip/chain-service';
import { AssetTransferCmd } from '@deip/command-models';


const userDtoService = new UserDtoService();
const attributeDtoService = new AttributeDtoService();
const userService = new UserService();


class UsersController extends BaseController {

  createUser = this.command({
    h: async (ctx) => {
      try {

        const chainService = await ChainService.getInstanceAsync(config);
        const chainNodeClient = chainService.getChainNodeClient();
        const chainTxBuilder = chainService.getChainTxBuilder();

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { entityId, email, memoKey, roles, creator } = appCmd.getCmdPayload();
          if (Array.isArray(roles) && roles.find(({ role }) => role === USER_ROLES.ADMIN)) {
            throw new BadRequestError(`Can't create admin account`);
          }

          if (!entityId || !memoKey || !creator) {
            throw new BadRequestError(`'entityId', 'memoKey', 'creator' fields are required`);
          }

          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          if (!pattern.test(email)) {
            throw new BadRequestError(`'email' field are required. Email should be correct and contains @`);
          }

          const existingProfile = await userService.getUser(entityId);
          if (existingProfile) {
            throw new ConflictError(`Profile for '${entityId}' is under consideration or has been approved already`);
          }
        };

        const msg = ctx.state.msg;
        const createAccountCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT);
        if (!createAccountCmd) {
          throw new BadRequestError(`This endpoint accepts 'CreateAccountCmd'`);
        }

        const { creator, entityId, authority } = createAccountCmd.getCmdPayload();
        const { wif: faucetPrivKey, username: faucetUsername, fundingAmount: faucetFundingAmount } = config.FAUCET_ACCOUNT;
        
        if (creator === faucetUsername) {
          await msg.tx.signAsync(faucetPrivKey, chainNodeClient);
        }

        const isPreFunding = config.PROTOCOL === PROTOCOL_CHAIN.SUBSTRATE && !!faucetFundingAmount;
        const isPostFunding = config.PROTOCOL === PROTOCOL_CHAIN.GRAPHENE && !!faucetFundingAmount;

        const fundUserAccount = async () => {
          const fundingTx = await chainTxBuilder.begin()
            .then((txBuilder) => {

              if (config.PROTOCOL === PROTOCOL_CHAIN.SUBSTRATE) {
                const { owner: { auths: [{ key: pubKey }]} } = authority;
                const seedFundingCmd = new AssetTransferCmd({
                  from: faucetUsername,
                  to: pubKey,
                  asset: { ...config.CORE_ASSET, amount: faucetFundingAmount },
                  memo: ''
                });
                txBuilder.addCmd(seedFundingCmd);
              }

              const daoFundingCmd = new AssetTransferCmd({
                from: faucetUsername,
                to: entityId,
                asset: { ...config.CORE_ASSET, amount: faucetFundingAmount },
                memo: ''
              });
              txBuilder.addCmd(daoFundingCmd);

              return txBuilder.end();
            })
            .then((finalizedTx) => finalizedTx.signAsync(faucetPrivKey, chainNodeClient))

          await assetCmdHandler.process(fundingTx.getPayload(), ctx);
        }

        if (isPreFunding) {
          await fundUserAccount();
          await new Promise((resolve) => {
            setTimeout(async function () {
              await accountCmdHandler.process(msg, ctx, validate);
              resolve();
            }, config.CHAIN_BLOCK_INTERVAL_MILLIS);
          });
        } else if (isPostFunding) {
          await accountCmdHandler.process(msg, ctx, validate);
          await new Promise((resolve) => {
            setTimeout(async function () {
              await fundUserAccount();
              resolve();
            }, config.CHAIN_BLOCK_INTERVAL_MILLIS);
          });
        } else {
          await accountCmdHandler.process(msg, ctx, validate);
        }

        ctx.status = 200;
        ctx.body = { entityId };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getUser = this.query({
    h: async (ctx) => {
      try {
        const username = ctx.params.username;
        const user = await userDtoService.getUser(username);
        if (!user) {
          throw new NotFoundError(`User "${username}" username is not found`);
        }
        ctx.status = 200;
        ctx.body = user;

      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
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
          throw new NotFoundError(`User "${email}" email is not found`);
        }
        ctx.status = 200;
        ctx.body = user;
      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
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
          throw new NotFoundError(`User "${username}" username is not found`);
        }
        ctx.status = 200;
        ctx.body = userProfile;
      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
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
          throw new ForbiddenError(`You have no permission to get '${username}' bookmarks`);
        }

        const bookmarks = await userBookmarkService.getUserBookmarks(username, type, ref);
        ctx.status = 200;
        ctx.body = bookmarks;

      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
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
        const portalId = ctx.params.portalId;
        const users = await userDtoService.getUsersByTenant(portalId);
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

  updateUser = this.command({
    form: UserForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT) {
            const {
              isTeamAccount
            } = appCmd.getCmdPayload();
            if (isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for user account`);
            }
          }
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT);
        const entityId = appCmd.getCmdPayload().entityId;

        ctx.status = 200;
        ctx.body = {
          entityId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  updateUserPassword = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ALTER_ACCOUNT_AUTHORITY);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.ALTER_ACCOUNT_AUTHORITY) {
            const {
              isTeamAccount
            } = appCmd.getCmdPayload();
            if (isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for user account`);
            }
          }
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ALTER_ACCOUNT_AUTHORITY);
        const entityId = appCmd.getCmdPayload().entityId;

        ctx.status = 200;
        ctx.body = {
          entityId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  addUserBookmark = async (ctx) => { // temp: need change to cmd
    try {
      const jwtUsername = ctx.state.user.username;
      const username = ctx.params.username;
      const userBookmarkService = new UserBookmarkService();
      if (username !== jwtUsername) {
        throw new ForbiddenError(`You have no permission to create '${username}' bookmarks`);
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
      ctx.status = err.httpStatus || 500;
      ctx.body = err.message;
    }
  }

  removeUserBookmark = async (ctx) => {//temp: need change to cmd
    try {
      const jwtUsername = ctx.state.user.username;
      const username = ctx.params.username;
      const bookmarkId = ctx.params.bookmarkId;

      const userBookmarkService = new UserBookmarkService();
      if (username !== jwtUsername) {
        throw new ForbiddenError(`You have no permission to remove '${username}' bookmarks`);
      }

      await userBookmarkService.removeUserBookmark(bookmarkId);
      ctx.status = 204;

    } catch (err) {
      console.log(err);
      ctx.status = err.httpStatus || 500;
      ctx.body = err.message;
    }
  }

  getAvatar = this.query({
    h: async (ctx) => {
      try {
        const username = ctx.params.username;
        const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
        const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
        const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
        const isRound = ctx.query.round ? ctx.query.round === 'true' : false;
        const user = await userDtoService.getUser(username);
        const defaultAvatar = FileStorage.getAccountDefaultAvatarFilePath();

        let src;
        let buff;

        if (user && user.profile && user.profile.attributes) {
          // temp solution //
          const attrs = await attributeDtoService.getNetworkAttributesByScope(ATTR_SCOPES.USER);
          const attr = attrs.find(
            ({
              type,
              title,
              tenantId
            }) => title === 'Avatar' && type === ATTR_TYPES.IMAGE && tenantId === user.tenantId
          );
          const userAttr = user.profile.attributes.find(({
            attributeId
          }) => attributeId.toString() === (attr ? attr._id.toString() : ''));
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
                .overlayWith(circleShape, {
                  cutout: true
                })
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
  });

}

const usersCtrl = new UsersController();

module.exports = usersCtrl;