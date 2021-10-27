import InvestmentOpportunityDtoService from './InvestmentOpportunityDtoService';
import BaseService from '../../base/BaseService';
import InvestmentOpportunityParticipationSchema from '../../../schemas/InvestmentOpportunityParticipationSchema';


class InvestmentOpportunityParticipationDtoService extends BaseService {
  constructor(options = { scoped: true }) {
    super(InvestmentOpportunityParticipationSchema, options);
  }

  async getInvstOppParticipations(investmentOpportunityId) {
    const invstOppParticipations = await this.findMany({ investmentOpportunityId });
    return invstOppParticipations
  }

  async getInvstOppParticipationsByProject(projectId) {
    const invstOppParticipations = await this.findMany({ projectId });
    return invstOppParticipations
  }

  async getInvstOppParticipationsHistoryByAccount(investor) {
    const investmentOpportunityDtoService = new InvestmentOpportunityDtoService();

    const invstOppParticipations = await this.findMany({ investor });
    const investmentOpportunitys = await investmentOpportunityDtoService.getInvstOpps(invstOppParticipations.map(i => i.investmentOpportunityId))
    return invstOppParticipations.map(i => ({
      ...i,
      investmentOpportunity: investmentOpportunitys.find(io => i.investmentOpportunityId === io._id)
    }))
  }
}


export default InvestmentOpportunityParticipationDtoService;