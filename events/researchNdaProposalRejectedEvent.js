import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';
import ProposalRejectedEvent from './proposalRejectedEvent';

class ResearchNdaProposalRejectedEvent extends ProposalRejectedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_NDA_PROPOSAL_REJECTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchNdaProposalRejectedEvent;