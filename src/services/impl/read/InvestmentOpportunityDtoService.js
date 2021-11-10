import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import BaseService from '../../base/BaseService';
import InvestmentOpportunitySchema from '../../../schemas/InvestmentOpportunitySchema';


class InvestmentOpportunityDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(InvestmentOpportunitySchema, options);
  }

  async mapInvstOpp(investmentOpps) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const chainInvestmentOpps = await Promise.all(investmentOpps.map((investmentOpp) => chainApi.getProjectTokenSaleAsync(investmentOpp._id)));

    return chainInvestmentOpps
      .map((chainInvestmentOp, i) => {
        const investmentOpp = investmentOpps.find((investmentOpp) => investmentOpp._id == chainInvestmentOp.external_id);
        return {
          chainInvestmentOp,
          ...investmentOpp,
          status: chainInvestmentOp.status
        }
      });
  }

  async getInvstOpp(invstOppId) {
    const investmentOpp = await this.findOne({ _id: invstOppId });
    if (!investmentOpp) return null;
    const results = await this.mapInvstOpp([investmentOpp]);
    const [result] = results;
    return result;
  }

  async getInvstOpps(invstOppIds) {
    const investmentOpps = await this.findMany({ _id: { $in: [...invstOppIds] } });
    const result = await this.mapInvstOpp(investmentOpps);
    return result;
  }
  
  async getInvstOppByProject(projectId) {
    const investmentOpps = await this.findMany({ projectId });
    const result = await this.mapInvstOpp(investmentOpps);
    return result;
  }
  
}


export default InvestmentOpportunityDtoService;