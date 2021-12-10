import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import BaseService from '../../base/BaseService';
import InvestmentOpportunitySchema from '../../../schemas/InvestmentOpportunitySchema';


class InvestmentOpportunityDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(InvestmentOpportunitySchema, options);
  }


  async mapInvstOpp(invstOpps) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainInvstOpps = await Promise.all(invstOpps.map((invstOpp) => chainRpc.getInvestmentOpportunityAsync(invstOpp._id)));
    
    return invstOpps.map((invstOpp) => {

      const chainInvstOpp = chainInvstOpps.find((chainInvstOpp) => chainInvstOpp && chainInvstOpp.invstOppId == invstOpp._id);
      if (!chainInvstOpp) {
        console.warn(`Investment opportunity with ID '${invstOpp._id}' is not found in the Chain`);
      }

      return {
        _id: invstOpp._id,
        tenantId: invstOpp.tenantId,
        projectId: invstOpp.projectId,
        title: invstOpp.title,
        metadata: invstOpp.metadata,
        teamId: invstOpp.teamId,
        startTime: invstOpp.startTime,
        endTime: invstOpp.endTime,
        shares: invstOpp.shares,
        softCap: invstOpp.softCap,
        hardCap: invstOpp.hardCap,
        creator: invstOpp.creator,
        totalInvested: invstOpp.totalInvested,
        type: invstOpp.type,
        createdAt: invstOpp.createdAt || invstOpp.created_at,
        updatedAt: invstOpp.updatedAt || invstOpp.updated_at,
        status: chainInvstOpp ? chainInvstOpp.status : null,

        // @deprecated
        chainInvestmentOp: chainInvstOpp
      };
    });;
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