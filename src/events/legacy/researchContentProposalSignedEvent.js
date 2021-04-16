import { APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';
import ProposalSignedEvent from './proposalSignedEvent';

class ResearchContentProposalSignedEvent extends ProposalSignedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_CONTENT_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchContentProposalSignedEvent;