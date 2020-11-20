import assert from 'assert';

// abstract
const ProposalRejectedEvent = (ProposalRejectedEvent) => class extends ProposalRejectedEvent {
  constructor(onchainDatums, offchainMeta, eventName = null) {
    assert(onchainDatums.some(([opName]) => opName == 'delete_proposal'), "delete_proposal_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getProposalId() {
    const [opName, { external_id: proposalId }] = this.onchainDatums.find(([opName]) => opName == 'delete_proposal');
    return proposalId;
  }
}

module.exports = ProposalRejectedEvent;