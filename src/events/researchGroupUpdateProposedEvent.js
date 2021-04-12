import assert from 'assert';
import { APP_EVENTS } from './../constants';
import ResearchGroupUpdatedEvent from './researchGroupUpdatedEvent';
import ProposalEvent from './proposalEvent';

class ResearchGroupUpdateProposedEvent extends ProposalEvent(ResearchGroupUpdatedEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchGroupUpdateProposedEvent;