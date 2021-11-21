import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import AssetService from './../write/AssetService';
const assetService = new AssetService()

class RevenueDtoService {
  async mapRevenueHistory(chainRevenueHistory) {
    const assets = await assetService.getAssetsBySymbols(chainRevenueHistory.map(c => c.revenue.split(' ')[1]))
    return chainRevenueHistory.map(c => {
      const [amount, symbol] = c.revenue.split(' ');
      const asset = assets.find(a => a.symbol === symbol);
      return {
        ...c,
        revenue: {
          id: asset._id,
          symbol,
          amount: `${Number(amount)}`,
          precision: asset.precision
        }
      }
    })
  }

  async getAssetRevenueHistory(symbol, cursor=0) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    
    const history = await chainRpc.getSecurityTokenRevenueHistoryAsync(symbol, cursor);
    const result = await this.mapRevenueHistory(history);
    return result;
  }


  async getAccountRevenueHistoryByAsset(account, symbol, step = 0, cursor = 0, targetAsset) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const history = await chainRpc.getAccountRevenueHistoryBySecurityTokenAsync(account, symbol, cursor, step, targetAsset);
    const result = await this.mapRevenueHistory(history);
    return result;
  }

  
  async getAccountRevenueHistory(account, cursor = 0) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const history = await chainRpc.getAccountRevenueHistoryAsync(account, cursor);
    const result = await this.mapRevenueHistory(history);
    return result;
  }
  
}


export default RevenueDtoService;