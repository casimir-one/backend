import assert from 'assert';

// abstract
const ProposalSignedEvent = (ProposalSignedEvent) => class extends ProposalSignedEvent {
  constructor(onchainDatums, offchainMeta, eventName = null) {
    assert(onchainDatums.some(([opName]) => opName == 'update_proposal'), "update_proposal_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getProposalId() {
    const [opName, { external_id: proposalId }] = this.onchainDatums.find(([opName]) => opName == 'update_proposal');
    return proposalId;
  }
}

module.exports = ProposalSignedEvent;