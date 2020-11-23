import assert from 'assert';
import { APP_EVENTS } from './../constants';
import ProposalEvent from './proposalEvent';
import ResearchTokenSaleCreatedEvent from './researchTokenSaleCreatedEvent';


class ResearchTokenSaleProposedEvent extends ProposalEvent(ResearchTokenSaleCreatedEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchTokenSaleProposedEvent;
