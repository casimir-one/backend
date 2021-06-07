import BaseController from '../base/BaseController';
import {AssetDtoService} from '../../services';

const assetDtoService = new AssetDtoService();

class AssetsController extends BaseController {
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
}

const assetsCtrl = new AssetsController();

module.exports = assetsCtrl;