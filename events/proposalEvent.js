import assert from 'assert';

// abstract
const ProposalEvent = (ProposalEvent) => class extends ProposalEvent {
  constructor(onchainDatums, offchainMeta, eventName = null) {
    assert(onchainDatums.some(([opName]) => opName == 'create_proposal'), "create_proposal_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getProposalId() {
    const [opName, { external_id: proposalId }] = this.onchainDatums.find(([opName]) => opName == 'create_proposal');
    return proposalId;
  }

  getProposalApprovals() {
    const proposalId = this.getProposalId();
    return this.onchainDatums.filter(([opName, opPayload]) => opName == 'update_proposal' && opPayload.external_id == proposalId);
  }
};


module.exports = ProposalEvent;