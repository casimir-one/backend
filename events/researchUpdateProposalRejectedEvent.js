import { APP_EVENTS } from './../constants';
import ProposalRejectedEvent from './proposalRejectedEvent';

class ResearchUpdateProposalRejectedEvent extends ProposalRejectedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_UPDATE_PROPOSAL_REJECTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchUpdateProposalRejectedEvent;