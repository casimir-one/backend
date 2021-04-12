import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';
import ProposalSignedEvent from './proposalSignedEvent';

class UserInvitationProposalSignedEvent extends ProposalSignedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = UserInvitationProposalSignedEvent;