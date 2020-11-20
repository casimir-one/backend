import { APP_EVENTS } from './../constants';
import ProposalSignedEvent from './proposalSignedEvent';

class ResearchProposalSignedEvent extends ProposalSignedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchProposalSignedEvent;