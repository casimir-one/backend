import BaseService from './../../base/BaseService';
import ProposalSchema from './../../../schemas/ProposalSchema';


class ProposalService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProposalSchema, options);
  }
  

  async getProposal(proposalId) {
    const proposal = await this.findOne({ _id: proposalId });
    return proposal || null;
  }

  
  async getProposals(proposalsIds) {
    const proposals = await this.findMany({ _id: { $in: [...proposalsIds] } });
    return proposals;
  }


  async createProposal({
    proposalId,
    proposalCmd,
    status,
    type,
    details,
    portalIdsScope,
    creator,
    decisionMakers
  }) {

    const result = await this.createOne({
      _id: proposalId,
      cmd: proposalCmd ? proposalCmd.serialize() : null,
      type: type,
      status: status,
      creator: creator,
      details: details,
      portalIdsScope: portalIdsScope,
      decisionMakers: decisionMakers,
      approvers: [],
      rejectors: []
    });

    return result;
  }


  async updateProposal(proposalId, {
    status,
    approvers,
    rejectors
  }) {

    const result = await this.updateOne({ _id: proposalId }, {
      status: status,
      approvers: approvers,
      rejectors: rejectors
    });

    return result;
  }

}

export default ProposalService;