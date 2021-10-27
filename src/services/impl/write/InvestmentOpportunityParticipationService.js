import BaseService from './../../base/BaseService';
import InvestmentOpportunityParticipationSchema from './../../../schemas/InvestmentOpportunityParticipationSchema';

class InvestmentOpportunityParticipationService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(InvestmentOpportunityParticipationSchema, options);
  }

  async createInvstOppParticipation({
    investmentOpportunityId,
    investor,
    asset,
    timestamp,
    projectId
  }) {
    const investmentOppParticipation = await this.createOne({
      investmentOpportunityId,
      investor,
      asset,
      timestamp,
      projectId
    });

    return investmentOppParticipation;
  }
}

export default InvestmentOpportunityParticipationService;