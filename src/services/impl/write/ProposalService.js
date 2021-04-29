import deipRpc from '@deip/rpc-client';
import { PROPOSAL_STATUS } from './../../../constants';
import BaseService from './../../base/BaseService';
import ProposalWriteModelSchema from './../../../schemas/write/ProposalWriteModelSchema';


class ProposalService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProposalWriteModelSchema, options);
  }
  
  async createProposal({
    proposalId,
    proposalCmd,
    type,
    creator
  }) {

    // TODO: replace protocol api call with status resolver
    const chainProposal = await deipRpc.api.getProposalStateAsync(proposalId);
    const status = PROPOSAL_STATUS[chainProposal.status];

    const result = await this.createOne({
      _id: proposalId,
      cmd: proposalCmd.serialize(),
      type: type,
      status: PROPOSAL_STATUS[status],
      creator: creator,
      requiredApprovals: chainProposal.required_approvals
    });

    return result;
  }


  async updateProposal(proposalId, {
    // TODO: add write schema data
  }) {

    // TODO: replace protocol api call with status resolver
    const chainProposal = await deipRpc.api.getProposalStateAsync(proposalId);
    const status = PROPOSAL_STATUS[chainProposal.status];

    const result = await this.updateOne({ _id: proposalId }, {
      status: PROPOSAL_STATUS[status]
    });

    return result;
  }

}

export default ProposalService;