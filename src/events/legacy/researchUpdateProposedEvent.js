import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import ResearchUpdatedEvent from './researchUpdatedEvent';
import ProposalEvent from './proposalEvent';

class ResearchUpdateProposedEvent extends ProposalEvent(ResearchUpdatedEvent) {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.RESEARCH_UPDATE_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchUpdateProposedEvent;