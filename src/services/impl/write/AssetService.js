import AssetSchema from './../../../schemas/AssetSchema';
import BaseService from './../../base/BaseService';


class AssetService extends BaseService {

  constructor(options = { scoped: true }) {
    super(AssetSchema, options);
  }

  async createAsset({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type,
    settings
  }) {

    const result = await this.createOne({
      _id: entityId,
      symbol,
      precision,
      issuer,
      description,
      type,
      settings
    });

    return result;
  }

  async getAssetBySymbol(symbol) {
    const asset = await this.findOne({ symbol });
    return asset;
  }

  async getAssetsBySymbols(symbols) {
    const assets = await this.findMany({ symbol: { $in: [...symbols] } });
    return assets;
  }
}


export default AssetService;