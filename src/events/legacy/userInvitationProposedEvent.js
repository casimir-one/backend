import assert from 'assert';
import { APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';
import ProposalEvent from './proposalEvent';

class UserInvitationProposedEvent extends ProposalEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.USER_INVITATION_PROPOSED) {
    assert(onchainDatums.some(([opName]) => opName == 'join_research_group_membership'), "join_research_group_membership_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'join_research_group_membership');
    const { notes, researches } = this.offchainMeta;
    const { member: invitee, research_group: researchGroupExternalId, reward_share: rewardShare } = opPayload;

    return { ...super.getSourceData(), invitee, researchGroupExternalId, rewardShare, notes, researches };
  }
}

module.exports = UserInvitationProposedEvent;