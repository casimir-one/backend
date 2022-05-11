import BaseController from '../base/BaseController';
import { APP_CMD } from '@deip/constants';
import qs from 'qs';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from './../../errors';
import { AssetDtoService, UserDtoService, NonFungibleTokenDtoService, FungibleTokenDtoService } from '../../services';
import { assetCmdHandler } from './../../command-handlers';


const assetDtoService = new AssetDtoService();
const userDtoService = new UserDtoService();
const nonFungibleTokenDtoService = new NonFungibleTokenDtoService();
const fungibleTokenDtoService = new FungibleTokenDtoService();

class AssetsController extends BaseController {

  getAccountDepositHistory = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const status = query.status;
        const account = ctx.params.account;
        const username = ctx.state.user.username;
        if (account != username) {
          const users = await userDtoService.getUsersByTeam(account);
          if (!users.find(u => u.username == username)) {
            throw new ForbiddenError(`You have no permission to get info about '${account}' account or ${account} doesn't exist`);
          }
        }
        const history = await assetDtoService.getAccountDepositHistory(account, status);
        ctx.successRes(history);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getAssetsByType = this.query({
    h: async (ctx) => {
      try {
        const type = ctx.params.type
        const assets = await assetDtoService.getAssetsByType(type);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getAssetsByIssuer = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer
        const assets = await assetDtoService.getAssetsByIssuer(issuer);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  lookupAssets = this.query({
    h: async (ctx) => {
      try {
        const limit = ctx.params.limit;
        const assets = await assetDtoService.lookupAssets(limit);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getNonFungibleTokenClass = this.query({
    h: async (ctx) => {
      try {
        const classId = ctx.params.classId;
        const nftClass = await nonFungibleTokenDtoService.getNonFungibleTokenClass(classId);
        if (!nftClass) {
          throw new NotFoundError(`Non fungible token class "${classId}" is not found`);
        }
        ctx.successRes(nftClass);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getNonFungibleTokenClasses = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const assets = await nonFungibleTokenDtoService.getNonFungibleTokenClasses(query);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getNonFungibleTokenClassInstancesByOwner = this.query({
    h: async (ctx) => {
      try {
        const { account, classId } = ctx.params;
        const assets = await nonFungibleTokenDtoService.getNonFungibleTokenClassInstancesByOwner(account, classId);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getNonFungibleTokenClassesInstancesByOwner = this.query({
    h: async (ctx) => {
      try {
        const account = ctx.params.account;
        const assets = await nonFungibleTokenDtoService.getNonFungibleTokenClassesInstancesByOwner(account);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  
  getFungibleTokenById = this.query({
    h: async (ctx) => {
      try {
        const assetId = ctx.params.assetId;
        const asset = await fungibleTokenDtoService.getFungibleTokenById(assetId);
        if (!asset) {
          throw new NotFoundError(`Asset "${assetId}" is not found`);
        }
        ctx.successRes(asset);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getFungibleTokenBySymbol = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await fungibleTokenDtoService.getFungibleTokenBySymbol(symbol);
        if (!assets) {
          throw new NotFoundError(`Asset "${symbol}" is not found`);
        }
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  
  getFungibleTokensByIssuer = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer;
        const assets = await fungibleTokenDtoService.getFungibleTokensByIssuer(issuer);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  lookupFungibleTokens = this.query({
    h: async (ctx) => {
      try {
        const { lowerBoundSymbol, limit } = ctx.params;
        const assets = await fungibleTokenDtoService.lookupFungibleTokens(lowerBoundSymbol, limit);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  getFungibleTokenBalance = this.query({
    h: async (ctx) => {
      try {
        const { owner, symbol } = ctx.params;
        const asset = await fungibleTokenDtoService.getFungibleTokenBalance(owner, symbol);
        if (!asset) {
          throw new NotFoundError(`Asset "${symbol}" is not found`);
        }
        ctx.successRes(asset);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  getFungibleTokenBalancesByOwner = this.query({
    h: async (ctx) => {
      try {
        const owner = ctx.params.owner;
        const asset = await fungibleTokenDtoService.getFungibleTokenBalancesByOwner(owner);
        ctx.successRes(asset);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  getFungibleTokenBalancesBySymbol = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await fungibleTokenDtoService.getFungibleTokenBalancesBySymbol(symbol);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  createFungibleTokenTransferRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_FT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_FT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.TRANSFER_FT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createNonFungibleTokenTransferRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_NFT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_NFT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.TRANSFER_NFT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createTokenSwapRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_FT || cmd.getCmdNum() === APP_CMD.TRANSFER_NFT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.TRANSFER_FT]} or ${APP_CMD[APP_CMD.TRANSFER_NFT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createFungibleToken = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_FT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });
  
  createNonFungibleToken = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
  

  issueFungibleToken = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ISSUE_FT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  issueNonFungibleToken = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ISSUE_NFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const {
            classId,
            instanceId
          } = appCmd.getCmdPayload();
          const instance = await nonFungibleTokenDtoService.getNonFungibleTokenClassInstancesByOwner(ctx.state.user.username, classId);
          if (instance.instancesIds.includes(instanceId)) {
            throw new ConflictError(`InstanceId ${instanceId} already exist`);
          }
          if (instanceId === 0) {
            throw new BadRequestError(`InstanceId cant not be 0`);
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });
}


const assetsCtrl = new AssetsController();


module.exports = assetsCtrl;