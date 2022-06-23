import BaseController from '../base/BaseController';
import { UserDtoService, AttributeDtoService, UserService, VerificationTokenService } from '../../services';
import sharp from 'sharp';
import qs from 'qs';
import config from '../../config';
import FileStorage from './../../storage';
import { accountCmdHandler, assetCmdHandler } from './../../command-handlers';
import { APP_CMD, ATTR_TYPES, PROTOCOL_CHAIN, SYSTEM_ROLE as USER_ROLES, USER_PROFILE_STATUS } from '@deip/constants';
import { UserForm } from './../../forms';
import { BadRequestError, NotFoundError, FailedDependencyError, ConflictError, ForbiddenError } from './../../errors';
import { ChainService } from '@deip/chain-service';
import { TransferFTCmd } from '@deip/commands';
import { transporter } from './../../nodemailer';
import { genSha256Hash, genRipemd160Hash } from '@deip/toolbox';


const userDtoService = new UserDtoService();
const attributeDtoService = new AttributeDtoService();
const userService = new UserService();
const verificationTokenService = new VerificationTokenService();

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

        const chainService = await ChainService.getInstanceAsync(config);
        const chainNodeClient = chainService.getChainNodeClient();
        const chainTxBuilder = chainService.getChainTxBuilder();

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DAO);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { entityId, email, roles, creator, confirmationCode } = appCmd.getCmdPayload();
          if (Array.isArray(roles) && roles.find(({ role }) => role === USER_ROLES.ADMIN)) {
            throw new BadRequestError(`Can't create admin account`);
          }

          if (!entityId || !creator) {
            throw new BadRequestError(`'entityId', 'creator' fields are required`);
          }

          if (!validateEmail(email)) {
            throw new BadRequestError(`'email' field are required. Email should be correct and contains @`);
          }

          const existingProfile = await userService.getUser(entityId);
          if (existingProfile) {
            throw new ConflictError(`Profile for '${entityId}' is under consideration or has been approved already`);
          }
          if (config.NEED_CONFIRM_REGISTRATION) {
            if (!confirmationCode) {
              throw new BadRequestError(`'confirmationCode' field are required`);
            }

            const token = await verificationTokenService.getTokenByTokenHash(genSha256Hash(confirmationCode));
            if (token && token.refId !== genRipemd160Hash(email)) {
              throw new ForbiddenError(`Incorrect confirmation code`);
            }
          }
        };

        const msg = ctx.state.msg;
        const createAccountCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DAO);
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
                const seedFundingCmd = new TransferFTCmd({
                  from: faucetUsername,
                  to: pubKey,
                  tokenId: config.CORE_ASSET.id,
                  amount: faucetFundingAmount,
                });
                txBuilder.addCmd(seedFundingCmd);
              }

              const daoFundingCmd = new TransferFTCmd({
                from: faucetUsername,
                to: entityId,
                tokenId: config.CORE_ASSET.id,
                amount: faucetFundingAmount
              });
              txBuilder.addCmd(daoFundingCmd);

              return txBuilder.end();
            })
            .then((finalizedTx) => finalizedTx.signAsync(faucetPrivKey, chainNodeClient))

          await assetCmdHandler.process(fundingTx.getPayload(), ctx);
        }

        if (isPreFunding) {
          await fundUserAccount();
          await accountCmdHandler.process(msg, ctx, validate);
        } else if (isPostFunding) {
          await accountCmdHandler.process(msg, ctx, validate);
          await fundUserAccount();
        } else {
          await accountCmdHandler.process(msg, ctx, validate);
        }

        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  sendRegistrationCodeByEmail = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.SEND_REGISTRATION_CODE_BY_EMAIL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { email } = appCmd.getCmdPayload();
          if (!validateEmail(email)) {
            throw new BadRequestError(`Invalid email address`);
          }
          const isTransporterCanConnect = await transporter.verify();
          if (!isTransporterCanConnect) {
            throw new FailedDependencyError(`Can't send email for confirm registration, please try again later`);
          }
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
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
        const username = ctx.params.username;
        const userProfile = await userDtoService.findUserProfileByOwner(username);
        if (!userProfile) {
          throw new NotFoundError(`User "${username}" username is not found`);
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
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DAO);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.UPDATE_DAO) {
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

        const entityId = this.extractEntityId(msg, APP_CMD.UPDATE_DAO);

        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  updateUserPassword = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ALTER_DAO_AUTHORITY);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.ALTER_DAO_AUTHORITY) {
            const {
              isTeamAccount
            } = appCmd.getCmdPayload();
            if (isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for user account`);
            }
          }
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

          const { wif: faucetPrivKey, username: faucetUsername, fundingAmount: faucetFundingAmount } = config.FAUCET_ACCOUNT;
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
        if (config.PROTOCOL === PROTOCOL_CHAIN.SUBSTRATE) {
          await fundUserAccount();
        }

        const { entityId } = alterDaoAuthorityCmd.getCmdPayload();

        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


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
          const attrs = await attributeDtoService.getNetworkAttributesByScope('user');
          const attr = attrs.find(
            ({
              type,
              title,
              portalId
            }) => title === 'Avatar' && (type === ATTR_TYPES.IMAGE || type === 'image') && portalId === user.portalId
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