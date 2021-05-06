import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import ProposalEvent from './proposalEvent';
import ResearchTokenSaleCreatedEvent from './researchTokenSaleCreatedEvent';


class ResearchTokenSaleProposedEvent extends ProposalEvent(ResearchTokenSaleCreatedEvent) {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchTokenSaleProposedEvent;
