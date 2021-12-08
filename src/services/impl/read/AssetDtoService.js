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
    const chainRpc = chainService.getChainRpc();
    const chainAssets = await Promise.all(assets.map(a => chainRpc.getAssetBySymbolAsync(a.symbol)));
    
    return assets.map((asset) => {

      const chainAsset = chainAssets.find((chainAsset) => chainAsset && chainAsset.symbol == asset.symbol);
      if (!chainAsset) {
        console.warn(`Asset with symbol '${asset.symbol}' is not found in the Chain`);
      }

      return { 
        _id: asset._id,
        tenantId: asset.tenantId,
        symbol: asset.symbol,
        precision: asset.precision,
        issuer: asset.issuer,
        description: asset.description,
        settings: { ...asset.settings },
        type: asset.type,
        
        // @deprecated
        max_supply: chainAsset ? chainAsset.currentSupply : null,
        current_supply: chainAsset ? chainAsset.currentSupply : null,
        string_symbol: chainAsset ? chainAsset.symbol : null,
        tokenized_research: asset.settings.projectId || null,
        tokenizedProject: asset.settings.projectId || null,
        license_revenue_holders_share: asset.settings.licenseRevenueHoldersShare || null
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
    const chainRpc = chainService.getChainRpc();

    const chainBalance = await chainRpc.getAssetBalanceByOwnerAndAssetSymbolAsync(owner, symbol);
    if (!chainBalance) return null;

    const asset = await this.findOne({ symbol: chainBalance.symbol });
    if (!asset) {
      console.warn(`Asset with symbol '${chainBalance.symbol}' is not found in the Read Model database`);
    }

    return {
      assetId: chainBalance.assetId,
      amount: chainBalance.amount,
      owner: chainBalance.account,
      symbol: chainBalance.symbol,
      precision: chainBalance.precision,
      // TODO: infer 'tokenizedProject' from balance object
      tokenizedProject: asset && asset.settings && asset.settings.projectId ? asset.settings.projectId : null,

      // @deprecated
      id: chainBalance.assetId, // should be '_id' of account balance object
      asset_id: chainBalance.assetId,
      asset_symbol: chainBalance.symbol || "",
      tokenized_research: asset && asset.settings && asset.settings.projectId ? asset.settings.projectId : null
    }
  }

  async getAccountAssetsBalancesByOwner(owner) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainBalances = await chainRpc.getAssetsBalancesByOwnerAsync(owner);
    const assets = await this.findMany({ symbol: { $in: [...chainBalances.map(chainBalance => chainBalance.symbol)] } });

    return chainBalances.map((chainBalance) => {
      const asset = assets.find(asset => asset.symbol === chainBalance.symbol);
      if (!asset) {
        console.warn(`Asset with symbol '${chainBalance.symbol}' is not found in the Read Model database`);
      }

      return {
        assetId: chainBalance.assetId,
        amount: chainBalance.amount,
        owner: chainBalance.account,
        symbol: chainBalance.symbol,
        precision: chainBalance.precision,
        // TODO: infer 'tokenizedProject' from balance object
        tokenizedProject: asset && asset.settings && asset.settings.projectId ? asset.settings.projectId : null,

        // @deprecated
        id: chainBalance.assetId, // should be '_id' of account balance object
        asset_id: chainBalance.assetId,
        asset_symbol: chainBalance.symbol || "",
        tokenized_research: asset && asset.settings && asset.settings.projectId ? asset.settings.projectId : null,
      }
    });
  }

  async getAccountsAssetBalancesByAsset(symbol) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainBalances = await chainRpc.getAssetBalancesByAssetSymbolAsync(symbol);

    const assets = await this.findMany({ symbol: { $in: [...chainBalances.map(chainBalance => chainBalance.symbol)] } });

    return chainBalances.map((chainBalance) => {
      const asset = assets.find(asset => asset.symbol === chainBalance.symbol);
      if (!asset) {
        console.warn(`Asset with symbol '${chainBalance.symbol}' is not found in the Read Model database`);
      }

      return {
        assetId: chainBalance.assetId,
        amount: chainBalance.amount,
        owner: chainBalance.account,
        symbol: chainBalance.symbol,
        precision: chainBalance.precision,
        // TODO: infer 'tokenizedProject' from balance object
        tokenizedProject: asset && asset.settings && asset.settings.projectId ? asset.settings.projectId : null,

        // @deprecated
        id: chainBalance.assetId,
        // should be '_id' of account balance object
        asset_id: chainBalance.assetId,
        asset_symbol: chainBalance.symbol || "",
        tokenized_research: asset && asset.settings && asset.settings.projectId ? asset.settings.projectId : null
      };
    });
  }

  async getAccountDepositHistory(account, status) {
    const query = { account };
    if (status) query.status = status;
    const history = await AssetDepositRequestSchema.find(query)
    return history;
  }

}


export default AssetDtoService;