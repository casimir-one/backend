import assert from 'assert';
import AppEvent from './appEvent';

// abstract
class ProposalRejectedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = null) {
    assert(onchainDatums.some(([opName]) => opName == 'delete_proposal'), "delete_proposal_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getProposalId() {
    let [opName, { external_id: proposalId }] = this.onchainDatums.find(([opName]) => opName == 'delete_proposal');
    return proposalId;
  }
}

module.exports = ProposalRejectedEvent;