import assert from 'assert';
import AppEvent from './appEvent';

// abstract
class ProposalSignedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = null) {
    assert(onchainDatums.some(([opName]) => opName == 'update_proposal'), "update_proposal_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getProposalId() {
    let [opName, { external_id: proposalId }] = this.onchainDatums.find(([opName]) => opName == 'update_proposal');
    return proposalId;
  }
}

module.exports = ProposalSignedEvent;