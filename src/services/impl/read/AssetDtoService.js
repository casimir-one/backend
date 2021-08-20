import BaseService from './../../base/BaseService';
import AssetDepositRequestSchema from '../../../schemas/AssetDepositRequestSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import AssetSchema from './../../../schemas/AssetSchema';


class AssetDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(AssetSchema, options);
  }

  async mapAssets(assets) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainAssets = await Promise.all(assets.map(a => chainApi.getAssetBySymbolAsync(a.symbol)));
    return assets
      .map((asset) => {
        const chainAsset = chainAssets.find((ca) => ca.string_symbol == asset.symbol);
        return { 
          ...asset,
          // support for legacy api
          max_supply: chainAsset.max_supply,
          current_supply: chainAsset.current_supply,
          string_symbol: chainAsset.string_symbol,
          tokenized_research: chainAsset.tokenized_research,
          license_revenue_holders_share: chainAsset.license_revenue_holders_share
        }
      });
  }

  async getAssetById(assetId) {
    const asset = await this.findOne({ _id: assetId });
    const [result] = await this.mapAssets([asset]);
    return result;
  }

  async getAssetBySymbol(symbol) {
    const asset = await this.findOne({ symbol });
    const [result] = await this.mapAssets([asset]);
    return result;
  }

  async getAssetsByType(type) {
    const assets = await this.findMany({ type });
    const result = await this.mapAssets(assets);
    return result;
  }

  async getAssetsByIssuer(issuer) {
    const assets = await this.findMany({ issuer });
    const result = await this.mapAssets(assets);
    return result;
  }
  
  async lookupAssets() {
    const assets = await this.findMany({});
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

  async getAccountDepositHistory(account, status) {
    const query = { account };
    if (status) query.status = status;
    const history = await AssetDepositRequestSchema.find(query)
    return history;
  }

}


export default AssetDtoService;