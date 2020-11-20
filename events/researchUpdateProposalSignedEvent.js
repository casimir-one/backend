import { APP_EVENTS } from './../constants';
import ProposalSignedEvent from './proposalSignedEvent';

class ResearchUpdateProposalSignedEvent extends ProposalSignedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_UPDATE_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchUpdateProposalSignedEvent;