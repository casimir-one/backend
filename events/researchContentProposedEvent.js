import assert from 'assert';
import { APP_EVENTS } from './../constants';
import ResearchContentCreatedEvent from './researchContentCreatedEvent';
import ProposalEvent from './proposalEvent';

class ResearchContentProposedEvent extends ProposalEvent(ResearchContentCreatedEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_CONTENT_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchContentProposedEvent;