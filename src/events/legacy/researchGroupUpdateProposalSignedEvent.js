import assert from 'assert';
import { APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';
import ProposalSignedEvent from './proposalSignedEvent';

class ResearchGroupUpdateProposalSignedEvent extends ProposalSignedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchGroupUpdateProposalSignedEvent;