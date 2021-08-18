import BaseService from './../../base/BaseService';
import FundraisingSchema from './../../../schemas/FundraisingSchema';

class FundraisingService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(FundraisingSchema, options);
  }

  async createFundraising({
    tokenSaleId,
    projectId,
    title,
    details
  }) {
    const fundraising = await this.createOne({
      _id: tokenSaleId,
      projectId,
      title,
      details
    });

    return fundraising;
  }
}

export default FundraisingService;