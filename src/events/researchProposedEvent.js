import assert from 'assert';
import { APP_EVENTS } from './../constants';
import ResearchCreatedEvent from './researchCreatedEvent';
import ProposalEvent from './proposalEvent';

class ResearchProposedEvent extends ProposalEvent(ResearchCreatedEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchProposedEvent;