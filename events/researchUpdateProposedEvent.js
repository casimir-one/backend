import assert from 'assert';
import { APP_EVENTS } from './../constants';
import ResearchUpdatedEvent from './researchUpdatedEvent';

class ResearchUpdateProposedEvent extends ResearchUpdatedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_UPDATE_PROPOSED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_proposal'), "create_proposal_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getProposalId() {
    let [opName, { external_id: proposalId }] = this.onchainDatums.find(([opName]) => opName == 'create_proposal');
    return proposalId;
  }

  getProposalApprovals() {
    const proposalId = this.getProposalId();
    return this.onchainDatums.filter(([opName, opPayload]) => opName == 'update_proposal' && opPayload.external_id == proposalId);
  }
}

module.exports = ResearchUpdateProposedEvent;