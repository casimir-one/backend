import FTClassSchema from '../../../schemas/FTClassSchema';
import BaseService from '../../base/BaseService';


class FTClassService extends BaseService {

  constructor(options = { scoped: true }) {
    super(FTClassSchema, options);
  }

  async createFTClass({
    _id,
    symbol,
    precision,
    issuer,
    description,
    type,
    metadata
  }) {

    const result = await this.createOne({
      _id: _id,
      symbol,
      precision,
      issuer,
      description,
      type,
      metadata
    });

    return result;
  }

  async getFTClassBySymbol(symbol) {
    const ftClass = await this.findOne({ symbol });
    return ftClass;
  }

  async getFTClassesBySymbols(symbols) {
    const ftClasss = await this.findMany({ symbol: { $in: [...symbols] } });
    return ftClasss;
  }
}


export default FTClassService;