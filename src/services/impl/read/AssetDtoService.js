import AssetDepositRequestSchema from '../../../schemas/AssetDepositRequestSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import AssetSchema from './../../../schemas/AssetSchema';

class AssetDtoService {
  async mapAssets(assets) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const assetsObj = assets.map(a => a.toObject());

    const chainAssets = await Promise.all(assetsObj.map(a => chainApi.getAssetBySymbolAsync(a.stringSymbol)));
    return assetsObj
      .map((asset, i) => {
        const chainAsset = chainAssets.find((ca) => ca.string_symbol == asset.stringSymbol);
        return {
          ...asset,
          currentSupply: chainAsset.current_supply,
          symbol: chainAsset.symbol
        }
      });
  }

  async getAccountDepositHistory(account, status) {
    const query = { account };
    if (status) query.status = status;
    const history = await AssetDepositRequestSchema.find(query)
    return history;
  }
  async getAssetById(assetId) {
    const asset = await AssetSchema.findOne({ _id: assetId });
    const result = await this.mapAssets([asset]);

    return result[0];
  }
  async getAssetBySymbol(symbol) {
    const asset = await AssetSchema.findOne({ stringSymbol: symbol });
    const result = await this.mapAssets([asset]);

    return result[0];
  }

  async getAssetsByType(type) {
    const assets = await AssetSchema.find({ type });
    const result = await this.mapAssets(assets);

    return result;
  }

  async getAssetsByIssuer(issuer) {
    const assets = await AssetSchema.find({ issuer });
    const result = await this.mapAssets(assets);

    return result;
  }
  
  async lookupAssets() {
    const assets = await AssetSchema.find();
    const result = await this.mapAssets(assets);

    return result;
  }

  async getAccountAssetBalance(owner, symbol) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.getAccountAssetBalanceAsync(owner, symbol);
    return asset;
  }

  async getAccountAssetsBalancesByOwner(owner) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.getAccountAssetsBalancesAsync(owner);
    return asset;
  }

  async getAccountsAssetBalancesByAsset(symbol) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.getAccountsAssetBalancesByAssetAsync(symbol);
    return asset;
  }
}

export default AssetDtoService;