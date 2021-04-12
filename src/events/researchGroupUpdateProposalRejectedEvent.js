import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';
import ProposalRejectedEvent from './proposalRejectedEvent';

class ResearchGroupUpdateProposalRejectedEvent extends ProposalRejectedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_REJECTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchGroupUpdateProposalRejectedEvent;