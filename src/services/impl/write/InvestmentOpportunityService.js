import BaseService from './../../base/BaseService';
import InvestmentOpportunitySchema from './../../../schemas/InvestmentOpportunitySchema';

class InvestmentOpportunityService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(InvestmentOpportunitySchema, options);
  }

  async createInvestmentOpportunity({
    tokenSaleId,
    projectId,
    title,
    metadata
  }) {

    const investmentOpp = await this.createOne({
      _id: tokenSaleId,
      projectId,
      title,
      metadata
    });

    return investmentOpp;
  }
}

export default InvestmentOpportunityService;