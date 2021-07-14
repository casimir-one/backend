import deipRpc from '@deip/rpc-client';
import AssetDepositRequestSchema from '../../../schemas/AssetDepositRequestSchema';

class AssetDtoService {
  async getAccountDepositHistory(account, status) {
    const query = { account };
    if (status) query.status = status;
    const history = await AssetDepositRequestSchema.find(query)
    return history;
  }
  async getAssetById(assetId) {
    const asset = await deipRpc.api.getAssetAsync(assetId);
    return asset;
  }
  async getAssetBySymbol(symbol) {
    const asset = await deipRpc.api.getAssetBySymbolAsync(symbol);
    return asset;
  }

  async getAssetsByType(type) {
    const asset = await deipRpc.api.getAssetsByTypeAsync(type);
    return asset;
  }

  async getAssetsByIssuer(issuer) {
    const asset = await deipRpc.api.getAssetsByIssuerAsync(issuer);
    return asset;
  }
  
  async lookupAssets(lowerBoundSymbol='', limit=10000) {
    const asset = await deipRpc.api.lookupAssetsAsync(lowerBoundSymbol, limit);
    return asset;
  }

  async getAccountAssetBalance(owner, symbol) {
    const asset = await deipRpc.api.getAccountAssetBalanceAsync(owner, symbol);
    return asset;
  }

  async getAccountAssetsBalancesByOwner(owner) {
    const asset = await deipRpc.api.getAccountAssetsBalancesAsync(owner);
    return asset;
  }

  async getAccountsAssetBalancesByAsset(symbol) {
    const asset = await deipRpc.api.getAccountsAssetBalancesByAssetAsync(symbol);
    return asset;
  }
}

export default AssetDtoService;