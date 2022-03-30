import BaseService from './../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import FungibleTokenSchema from './../../../schemas/FungibleTokenSchema';


class FungibleTokenDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(FungibleTokenSchema, options);
  }

  async mapFungibleTokens(fungibleTokens) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainFungibleTokens = await Promise.all(fungibleTokens.map(a => chainRpc.getFungibleTokenBySymbolAsync(a.symbol)));
    
    return fungibleTokens.map((fungibleToken) => {

      const chainFungibleToken = chainFungibleTokens.find((chainFungibleToken) => chainFungibleToken && chainFungibleToken.symbol == fungibleToken.symbol);
      if (!chainFungibleToken) {
        console.warn(`Fungible token with symbol '${fungibleToken.symbol}' is not found in the Chain`);
      }

      return { 
        _id: fungibleToken._id,
        portalId: fungibleToken.portalId,
        symbol: fungibleToken.symbol,
        precision: fungibleToken.precision,
        issuer: fungibleToken.issuer,
        description: fungibleToken.description,
        metadata: { ...fungibleToken.metadata },
        type: fungibleToken.type,
        currentSupply: chainFungibleToken ? chainFungibleToken.currentSupply : null,
        
        // @deprecated
        settings: { ...fungibleToken.metadata },
        max_supply: chainFungibleToken ? chainFungibleToken.currentSupply : null,
        current_supply: chainFungibleToken ? chainFungibleToken.currentSupply : null,
        string_symbol: chainFungibleToken ? chainFungibleToken.symbol : null,
        tokenized_project: fungibleToken.metadata.projectId || null,
        tokenizedProject: fungibleToken.metadata.projectId || null,
        license_revenue_holders_share: fungibleToken.metadata.licenseRevenueHoldersShare || null
      }

    });
  }

  async getFungibleTokenById(fungibleTokenId) {
    const fungibleToken = await this.findOne({ _id: fungibleTokenId });
    const [result] = await this.mapFungibleTokens([fungibleToken]);
    return result;
  }

  async getFungibleTokenBySymbol(symbol) {
    const fungibleToken = await this.findOne({ symbol });
    const [result] = await this.mapFungibleTokens([fungibleToken]);
    return result;
  }

  async getFungibleTokensByType(type) {
    const fungibleTokens = await this.findMany({ type });
    const result = await this.mapFungibleTokens(fungibleTokens);
    return result;
  }

  async getFungibleTokensByIssuer(issuer) {
    const fungibleTokens = await this.findMany({ issuer });
    const result = await this.mapFungibleTokens(fungibleTokens);
    return result;
  }

  async getFungibleTokensByProjects(projectsIds) {
    const fungibleTokens = await this.findMany({ "metadata.projectId": { $in: projectsIds } });
    const result = await this.mapFungibleTokens(fungibleTokens);
    return result;
  }
  
  async lookupFungibleTokens() {
    const fungibleTokens = await this.findMany({});
    const result = await this.mapFungibleTokens(fungibleTokens);
    return result;
  }

  async getFungibleTokenBalance(owner, symbol) {
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
      // TODO: infer 'tokenizedProject' from balance object
      tokenizedProject: token && token.metadata && token.metadata.projectId ? token.metadata.projectId : null,

      // @deprecated
      assetId: chainBalance.assetId,
      id: chainBalance.assetId, // should be '_id' of account balance object
      asset_id: chainBalance.assetId,
      asset_symbol: chainBalance.symbol || "",
      tokenized_project: token && token.metadata && token.metadata.projectId ? token.metadata.projectId : null
    }
  }

  async getFungibleTokenBalancesByOwner(owner) {
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
        // TODO: infer 'tokenizedProject' from balance object
        tokenizedProject: token && token.metadata && token.metadata.projectId ? token.metadata.projectId : null,

        // @deprecated
        assetId: chainBalance.assetId,
        id: chainBalance.assetId, // should be '_id' of account balance object
        asset_id: chainBalance.assetId,
        asset_symbol: chainBalance.symbol || "",
        tokenized_project: token && token.metadata && token.metadata.projectId ? token.metadata.projectId : null,
      }
    });
  }

  async getFungibleTokenBalancesBySymbol(symbol) {
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
        // TODO: infer 'tokenizedProject' from balance object
        tokenizedProject: token && token.metadata && token.metadata.projectId ? token.metadata.projectId : null,

        // @deprecated
        id: chainBalance.assetId,
        assetId: chainBalance.assetId,
        // should be '_id' of account balance object
        asset_id: chainBalance.assetId,
        asset_symbol: chainBalance.symbol || "",
        tokenized_project: token && token.metadata && token.metadata.projectId ? token.metadata.projectId : null
      };
    });
  }
}


export default FungibleTokenDtoService;