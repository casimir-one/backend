import FungibleTokenSchema from './../../../schemas/FungibleTokenSchema';
import BaseService from './../../base/BaseService';


class FungibleTokenService extends BaseService {

  constructor(options = { scoped: true }) {
    super(FungibleTokenSchema, options);
  }

  async createFungibleToken({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type,
    metadata
  }) {

    const result = await this.createOne({
      _id: entityId,
      symbol,
      precision,
      issuer,
      description,
      type,
      metadata
    });

    return result;
  }

  async getFungibleTokenBySymbol(symbol) {
    const fungibleToken = await this.findOne({ symbol });
    return fungibleToken;
  }

  async getFungibleTokensBySymbols(symbols) {
    const fungibleTokens = await this.findMany({ symbol: { $in: [...symbols] } });
    return fungibleTokens;
  }
}


export default FungibleTokenService;