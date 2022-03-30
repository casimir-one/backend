import BaseService from './../../base/BaseService';
import AssetDepositRequestSchema from '../../../schemas/AssetDepositRequestSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import AssetSchema from './../../../schemas/AssetSchema';
import { ASSET_TYPE } from '@deip/constants';


class AssetDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(AssetSchema, options);
  }

  async mapAssets(assets) {
    return assets.map((asset) => {
      let defaultModel = {
        _id: asset._id,
        portalId: asset.portalId,
        issuer: asset.issuer,
        description: asset.description,
        type: asset.type,
        name: asset.name
      };
      if (asset.type === ASSET_TYPE.FT || asset.type === ASSET_TYPE.CORE) {
        return {
          ...defaultModel,
          symbol: asset.symbol,
          precision: asset.precision
        }
      }
      return defaultModel;
    });
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

  async getAccountDepositHistory(account, status) {
    const query = { account };
    if (status) query.status = status;
    const history = await AssetDepositRequestSchema.find(query)
    return history;
  }

}


export default AssetDtoService;