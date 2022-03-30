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
    name,
    description,
    type,
  }) {

    const result = await this.createOne({
      _id: entityId,
      symbol,
      precision,
      issuer,
      description,
      name,
      type,
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