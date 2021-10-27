import BaseService from './../../base/BaseService';
import InvestmentOpportunitySchema from './../../../schemas/InvestmentOpportunitySchema';

class InvestmentOpportunityService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(InvestmentOpportunitySchema, options);
  }

  async createInvstOpp({
    invstOppId,
    teamId,
    projectId,
    startTime,
    endTime,
    shares,
    softCap,
    hardCap,
    creator,
    title,
    totalInvested,
    metadata,
    status
  }) {

    const investmentOpp = await this.createOne({
      _id: invstOppId,
      teamId,
      projectId,
      startTime,
      endTime,
      shares,
      softCap,
      hardCap,
      creator,
      title,
      totalInvested,
      metadata,
      status
    });

    return investmentOpp;
  }

  async updateInvstOpp({
    _id,
    totalInvested,
    status
  }) {
    const result = await this.updateOne({ _id }, {
      totalInvested,
      status
    });

    return result;
  }

  async getInvstOpp(invstOppId) {
    const investmentOpp = await this.findOne({ _id: invstOppId });
    return investmentOpp;
  }
}

export default InvestmentOpportunityService;