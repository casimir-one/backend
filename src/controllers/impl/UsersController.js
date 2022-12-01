import BaseController from '../base/BaseController';
import { UserDtoService, AttributeDtoService, UserService } from '../../services';
import sharp from 'sharp';
import qs from 'qs';
import config from '../../config';
import FileStorage from './../../storage';
import { accountCmdHandler, assetCmdHandler } from './../../command-handlers';
import { APP_CMD, AttributeScope, ProtocolChain, SYSTEM_ROLE, USER_PROFILE_STATUS } from '@casimir.one/platform-core';
import { UserForm } from './../../forms';
import { BadRequestError, NotFoundError, FailedDependencyError, ConflictError, ForbiddenError } from './../../errors';
import { ChainService } from '@casimir.one/chain-service';
import { TransferFTCmd } from '@casimir.one/commands';


const userDtoService = new UserDtoService();
const attributeDtoService = new AttributeDtoService();
const userService = new UserService();

const validateEmail = (email) => {
  const patternStr = ['^(([^<>()[\\]\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)',
    '|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.',
    '[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+',
    '[a-zA-Z]{2,}))$'].join('');
  const pattern = new RegExp(patternStr);

  return pattern.test(email) && email.split('@')[0].length <= 64;
}


class UsersController extends BaseController {

  createUser = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const cmd1 = {
            cmdNum: APP_CMD.CREATE_USER,
            validate: async (cmd) => {
              const { _id, email, roles } = cmd.getCmdPayload();
              if (Array.isArray(roles) && roles.find(({ role }) => role === SYSTEM_ROLE.ADMIN)) {
                throw new BadRequestError(`Admin user cannot be created`);
              }
              if (!_id) {
                throw new BadRequestError(`'_id' fields is required`);
              }
              if (!validateEmail(email)) {
                throw new BadRequestError(`'email' field is required and should be in correct format`);
              }
            }
          };
          const validCmdsOrder = [cmd1];
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);
        
        const _id = this.extractEntityId(msg, APP_CMD.CREATE_USER);
        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  importDAO = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateImportDAO = async (importDAOCmd, cmdStack) => {
            const { _id, email, creator, confirmationCode, isTeamAccount } = importDAOCmd.getCmdPayload();

            if (!_id) {
              throw new BadRequestError(`'_id' field are required`);
            }
            if (isTeamAccount) {
              throw new BadRequestError(`Team account cannot be imported`);
            }
  
            const existingProfile = await userService.getUser(_id);
            if (existingProfile) {
              throw new ConflictError(`Profile for '${_id}' is under consideration or has been imported already`);
            }
          };

          const importDAOSettings = {
            cmdNum: APP_CMD.IMPORT_DAO,
            validate: validateImportDAO
          };
          
          const validCmdsOrder = [importDAOSettings];
          
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;

        const importAccountCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.IMPORT_DAO);
        const { _id } = importAccountCmd.getCmdPayload();

        await accountCmdHandler.process(msg, ctx, validate);

        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getUser = this.query({
    h: async (ctx) => {
      try {
        const _id = ctx.params._id;
        const user = await userDtoService.getUser(_id);
        if (!user) {
          throw new NotFoundError(`User "${_id}" _id is not found`);
        }
        ctx.successRes(user);

      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  checkIfUserExists = this.query({
    h: async (ctx) => {
      try {
        const usernameOrEmail = ctx.params.usernameOrEmail;
        let user;
        if (usernameOrEmail.includes('@')) {
          user = await userDtoService.getUserByEmail(usernameOrEmail);
        } else {
          user = await userDtoService.getUser(usernameOrEmail);
        }
        ctx.successRes({ exists: user ? true : false });
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getUsers = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const usernames = query.usernames ? Object.values(query.usernames) : [];
        const users = await userDtoService.getUsers(usernames);
        ctx.successRes(users);

      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
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
        ctx.successRes(user);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getUserProfile = this.query({
    h: async (ctx) => {
      try {
        const _id = ctx.params._id;
        const userProfile = await userDtoService.findUserProfileByOwner(_id);
        if (!userProfile) {
          throw new NotFoundError(`User "${_id}" _id is not found`);
        }
        ctx.successRes(userProfile);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
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

        ctx.successRes(usersProfiles);

      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getActiveUsersProfiles = this.query({
    h: async (ctx) => {
      try {
        const activeUsersProfiles = await userDtoService.findUserProfilesByStatus(USER_PROFILE_STATUS.APPROVED);
        ctx.successRes(activeUsersProfiles);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getUsersByTeam = this.query({
    h: async (ctx) => {
      try {
        const teamId = ctx.params.teamId;
        const members = await userDtoService.getUsersByTeam(teamId);
        ctx.successRes(members);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getUsersByPortal = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.params.portalId;
        const users = await userDtoService.getUsersByPortal(portalId);
        ctx.successRes(users);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getUsersListing = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const users = await userDtoService.getUsersListing(query.status);
        ctx.successRes(users);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  updateUser = this.command({
    form: UserForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateUpdateUser = async (updateUserCmd, cmdStack) => {
            const {
              isTeamAccount
            } = updateUserCmd.getCmdPayload();
            if (isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for user account`);
            }
          };

          const updateUserSettings = {
            cmdNum: APP_CMD.UPDATE_DAO,
            validate: validateUpdateUser
          };
          
          const validCmdsOrder = [updateUserSettings];
          
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const _id = this.extractEntityId(msg, APP_CMD.UPDATE_DAO);

        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  updateUserPassword = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateUpdateUserPassword = async (updateUserPasswordCmd, cmdStack) => {
            const {
              isTeamAccount
            } = updateUserPasswordCmd.getCmdPayload();
            if (isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for user account`);
            }
          };

          const updateUserSettings = {
            cmdNum: APP_CMD.ALTER_DAO_AUTHORITY,
            validate: validateUpdateUserPassword
          };
          
          const validCmdsOrder = [updateUserSettings];
          
          await this.validateCmds(appCmds, validCmdsOrder);
        };


        const msg = ctx.state.msg;
        const alterDaoAuthorityCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ALTER_DAO_AUTHORITY);
        if (!alterDaoAuthorityCmd) {
          throw new BadRequestError(`This endpoint accepts 'AlterDaoAuthorityCmd'`);
        }

        const fundUserAccount = async () => {
          const chainService = await ChainService.getInstanceAsync(config);
          const chainNodeClient = chainService.getChainNodeClient();
          const chainTxBuilder = chainService.getChainTxBuilder();

          const { wif: faucetPrivKey, _id: faucetUsername, fundingAmount: faucetFundingAmount } = config.FAUCET_ACCOUNT;
          const fundingTx = await chainTxBuilder.begin()
            .then((txBuilder) => {
              const { authority } = alterDaoAuthorityCmd.getCmdPayload();
              const { owner: { auths: [{ key: pubKey }] } } = authority;
              const seedFundingCmd = new TransferFTCmd({
                from: faucetUsername,
                to: pubKey,
                tokenId: config.CORE_ASSET.id,
                amount: faucetFundingAmount
              });
              txBuilder.addCmd(seedFundingCmd);
              return txBuilder.end();
            })
            .then((finalizedTx) => finalizedTx.signAsync(faucetPrivKey, chainNodeClient))

          await assetCmdHandler.process(fundingTx.getPayload(), ctx);
        }

        await accountCmdHandler.process(msg, ctx, validate);
        // @temp solution for TESTNET
        if (config.PROTOCOL === ProtocolChain.SUBSTRATE) {
          await fundUserAccount();
        }

        const { _id } = alterDaoAuthorityCmd.getCmdPayload();

        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  getAvatar = this.query({
    h: async (ctx) => {
      try {
        const _id = ctx.params._id;
        const width = ctx.query.width ? parseInt(ctx.query.width) : 200;
        const height = ctx.query.height ? parseInt(ctx.query.height) : 200;
        const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
        const isRound = ctx.query.round ? ctx.query.round === 'true' : false;
        const user = await userDtoService.getUser(_id);
        const defaultAvatar = FileStorage.getAccountDefaultAvatarFilePath();

        let src;
        let buff;

        if (user && user.profile && user.profile.attributes) {

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
        ctx.successRes(avatar, { withoutWrap: true });

      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

}

const usersCtrl = new UsersController();

module.exports = usersCtrl;