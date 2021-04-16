import { APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';
import ProposalSignedEvent from './proposalSignedEvent';

class ResearchProposalSignedEvent extends ProposalSignedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchProposalSignedEvent;