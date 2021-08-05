import deipRpc from '@deip/rpc-client';
import AssetDepositRequestSchema from '../../../schemas/AssetDepositRequestSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';

class AssetDtoService {
  async getAccountDepositHistory(account, status) {
    const query = { account };
    if (status) query.status = status;
    const history = await AssetDepositRequestSchema.find(query)
    return history;
  }
  async getAssetById(assetId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.getAssetAsync(assetId);
    return asset;
  }
  async getAssetBySymbol(symbol) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.getAssetBySymbolAsync(symbol);
    return asset;
  }

  async getAssetsByType(type) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.getAssetsByTypeAsync(type);
    return asset;
  }

  async getAssetsByIssuer(issuer) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.getAssetsByIssuerAsync(issuer);
    return asset;
  }
  
  async lookupAssets(lowerBoundSymbol='', limit=10000) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    
    const asset = await chainApi.lookupAssetsAsync(lowerBoundSymbol, limit);
    return asset;
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