import assert from 'assert';
import { APP_EVENTS } from './../constants';
import ResearchUpdatedEvent from './researchUpdatedEvent';
import ProposalEvent from './proposalEvent';

class ResearchUpdateProposedEvent extends ProposalEvent(ResearchUpdatedEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_UPDATE_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchUpdateProposedEvent;