import { APP_PROPOSAL } from '@deip/constants';
import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class TeamInviteDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.ADD_DAO_MEMBER_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.ADD_DAO_MEMBER_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const joinProjectCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime, creator: inviter } = proposalCmd.getCmdPayload();
    const { member: invitee, teamId, notes } = joinProjectCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!invitee, `'invitee' is required`);
    assert(!!inviter, `'inviter' is required`);
    assert(!!teamId, `'teamId' is required`);

    super(APP_EVENT.TEAM_INVITE_DECLINED, {
      proposalId,
      expirationTime,
      invitee,
      teamId,
      notes,
      inviter,
      proposalCtx
    });
  }

}


module.exports = TeamInviteDeclinedEvent;