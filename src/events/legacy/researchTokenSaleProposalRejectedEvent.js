import { LEGACY_APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';
import ProposalRejectedEvent from './proposalRejectedEvent';

class ResearchTokenSaleProposalRejectedEvent extends ProposalRejectedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSAL_REJECTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchTokenSaleProposalRejectedEvent;