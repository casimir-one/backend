import { PROPOSAL_STATUS } from './../../../constants';
import BaseService from './../../base/BaseService';
import ProposalSchema from './../../../schemas/ProposalSchema';


class ProposalService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProposalSchema, options);
  }
  
  async createProposal({
    proposalId,
    proposalCmd,
    status,
    type,
    details,
    multiTenantIds,
    creator
  }) {

    const result = await this.createOne({
      _id: proposalId,
      cmd: proposalCmd ? proposalCmd.serialize() : null,
      type: type,
      status: status,
      creator: creator,
      details: details,
      multiTenantIds: multiTenantIds
    });

    return result;
  }


  async updateProposal(proposalId, {
    status
  }) {

    const result = await this.updateOne({ _id: proposalId }, {
      status: status
    });

    return result;
  }

}

export default ProposalService;