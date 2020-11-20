import { APP_EVENTS } from './../constants';
import ProposalRejectedEvent from './proposalRejectedEvent';

class ResearchProposalRejectedEvent extends ProposalRejectedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_PROPOSAL_REJECTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchProposalRejectedEvent;