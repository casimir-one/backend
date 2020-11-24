import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';
import ProposalEvent from './proposalEvent';

class UserResignationProposedEvent extends ProposalEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.USER_RESIGNATION_PROPOSED) {
    assert(onchainDatums.some(([opName]) => opName == 'leave_research_group_membership'), "leave_research_group_membership_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'leave_research_group_membership');
    const { member, research_group: researchGroupExternalId } = opPayload;
    const { notes } = this.offchainMeta;
    return { member, researchGroupExternalId, notes };
  }
}

module.exports = UserResignationProposedEvent;