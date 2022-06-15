import BaseService from '../../base/BaseService';
import config from '../../../config';
import { ChainService } from '@deip/chain-service';
import FTClassSchema from '../../../schemas/FTClassSchema';


class FTClassDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(FTClassSchema, options);
  }

  async mapFTClassess(ftClasses) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainFTClasses = await Promise.all(ftClasses.map(a => chainRpc.getFungibleTokenBySymbolAsync(a.symbol)));
    
    return ftClasses.map((ftClass) => {

      const chainFTClass = chainFTClasses.find((chainFTClass) => chainFTClass && chainFTClass.symbol == ftClass.symbol);
      if (!chainFTClass) {
        console.warn(`Fungible token with symbol '${ftClass.symbol}' is not found in the Chain`);
      }

      return { 
        _id: ftClass._id,
        portalId: ftClass.portalId,
        symbol: ftClass.symbol,
        precision: ftClass.precision,
        issuer: ftClass.issuer,
        description: ftClass.description,
        metadata: { ...ftClass.metadata },
        type: ftClass.type,
        currentSupply: chainFTClass ? chainFTClass.currentSupply : null,
        
        // @deprecated
        settings: { ...ftClass.metadata },
        max_supply: chainFTClass ? chainFTClass.currentSupply : null,
        current_supply: chainFTClass ? chainFTClass.currentSupply : null,
        string_symbol: chainFTClass ? chainFTClass.symbol : null
      }

    });
  }

  async getFTClassById(ftClassId) {
    const ftClass = await this.findOne({ _id: ftClassId });
    const [result] = await this.mapFTClassess([ftClass]);
    return result;
  }

  async getFTClassBySymbol(symbol) {
    const ftClass = await this.findOne({ symbol });
    const [result] = await this.mapFTClassess([ftClass]);
    return result;
  }

  async getFTClassesByType(type) {
    const ftClasses = await this.findMany({ type });
    const result = await this.mapFTClassess(ftClasses);
    return result;
  }

  async getFTClassesByIssuer(issuer) {
    const ftClasses = await this.findMany({ issuer });
    const result = await this.mapFTClassess(ftClasses);
    return result;
  }
  
  async lookupFTClassess() {
    const ftClasses = await this.findMany({});
    const result = await this.mapFTClassess(ftClasses);
    return result;
  }

  async getFTClassBalance(owner, symbol) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainBalance = await chainRpc.getFungibleTokenBalanceByOwnerAndSymbolAsync(owner, symbol);
    if (!chainBalance) return null;

    const token = await this.findOne({ symbol: chainBalance.symbol });
    if (!token) {
      console.warn(`Token with symbol '${chainBalance.symbol}' is not found in the Read Model database`);
    }

    return {
      tokenId: chainBalance.assetId,
      amount: chainBalance.amount,
      owner: chainBalance.account,
      symbol: chainBalance.symbol,
      precision: chainBalance.precision,
      type: token.type,

      // @deprecated
      assetId: chainBalance.assetId,
      id: chainBalance.assetId, // should be '_id' of account balance object
      asset_id: chainBalance.assetId,
      asset_symbol: chainBalance.symbol || ""
    }
  }

  async getFTClassBalancesByOwner(owner) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainBalances = await chainRpc.getFungibleTokenBalancesByOwnerAsync(owner);
    const tokens = await this.findMany({ symbol: { $in: [...chainBalances.map(chainBalance => chainBalance.symbol)] } });

    return chainBalances.map((chainBalance) => {
      const token = tokens.find(token => token.symbol === chainBalance.symbol);
      if (!token) {
        console.warn(`Token with symbol '${chainBalance.symbol}' is not found in the Read Model database`);
      }

      return {
        tokenId: chainBalance.assetId,
        amount: chainBalance.amount,
        owner: chainBalance.account,
        symbol: chainBalance.symbol,
        precision: chainBalance.precision,

        // @deprecated
        assetId: chainBalance.assetId,
        id: chainBalance.assetId, // should be '_id' of account balance object
        asset_id: chainBalance.assetId,
        asset_symbol: chainBalance.symbol || ""
      }
    });
  }

  async getFTClassBalancesBySymbol(symbol) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainBalances = await chainRpc.getFungibleTokenBalancesBySymbolAsync(symbol);

    const tokens = await this.findMany({ symbol: { $in: [...chainBalances.map(chainBalance => chainBalance.symbol)] } });

    return chainBalances.map((chainBalance) => {
      const token = tokens.find(token => token.symbol === chainBalance.symbol);
      if (!token) {
        console.warn(`Token with symbol '${chainBalance.symbol}' is not found in the Read Model database`);
      }

      return {
        tokenId: chainBalance.assetId,
        amount: chainBalance.amount,
        owner: chainBalance.account,
        symbol: chainBalance.symbol,
        precision: chainBalance.precision,

        // @deprecated
        id: chainBalance.assetId,
        assetId: chainBalance.assetId,
        // should be '_id' of account balance object
        asset_id: chainBalance.assetId,
        asset_symbol: chainBalance.symbol || ""
      };
    });
  }
}


export default FTClassDtoService;