import BaseController from '../base/BaseController';
import {APP_CMD} from '@deip/command-models';
import { BadRequestError } from './../../errors';
import { AssetDtoService, UserDtoService } from '../../services';
import { assetCmdHandler } from './../../command-handlers';
import qs from 'qs';

const assetDtoService = new AssetDtoService();
const userDtoService = new UserDtoService();

class AssetsController extends BaseController {
  getAccountDepositHistory = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const status = query.status;
        const account = ctx.params.account;
        const username = ctx.state.user.username;
        if (account != username) {
          const users = await userDtoService.getUsersByTeam(account)

          if (!users.find(u => u.username == username)) {
            ctx.status = 403;
            ctx.body = `You have no permission to get info about '${account}' account or ${account} doesn't exist`;
            return;
          }
        }
        const history = await assetDtoService.getAccountDepositHistory(account, status);
        ctx.body = history;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  getAssetById = this.query({
    h: async (ctx) => {
      try {
        const assetId = ctx.params.assetId;
        const asset = await assetDtoService.getAssetById(assetId);
        if (!asset) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = asset;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
   getAssetBySymbol = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await assetDtoService.getAssetBySymbol(symbol);
        if (!assets) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = assets;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
   getAssetsByType = this.query({
    h: async (ctx) => {
      try {
        const type = ctx.params.type;
        const assets = await assetDtoService.getAssetsByType(type);
        if (!assets) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = assets;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
   getAssetsByIssuer = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer;
        const assets = await assetDtoService.getAssetsByIssuer(issuer);
        if (!assets) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = assets;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
   lookupAssets = this.query({
    h: async (ctx) => {
      try {
        const { lowerBoundSymbol, limit } = ctx.params;
        const assets = await assetDtoService.lookupAssets(lowerBoundSymbol, limit);
        if (!assets) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = assets;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
   getAccountAssetBalance = this.query({
    h: async (ctx) => {
      try {
        const { owner, symbol } = ctx.params;
        const asset = await assetDtoService.getAccountAssetBalance(owner, symbol);
        if (!asset) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = asset;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
   getAccountAssetsBalancesByOwner = this.query({
    h: async (ctx) => {
      try {
        const owner = ctx.params.owner;
        const asset = await assetDtoService.getAccountAssetsBalancesByOwner(owner);
        if (!asset) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = asset;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
  
   getAccountsAssetBalancesByAsset = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await assetDtoService.getAccountsAssetBalancesByAsset(symbol);
        if (!assets) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = assets;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  createAssetTransferRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ASSET_TRANSFER || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.ASSET_TRANSFER)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.ASSET_TRANSFER]} protocol cmd`);
            }
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

  createAssetExchangeRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.ASSET_TRANSFER)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.ASSET_TRANSFER]} protocol cmd`);
            }
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
}

const assetsCtrl = new AssetsController();

module.exports = assetsCtrl;