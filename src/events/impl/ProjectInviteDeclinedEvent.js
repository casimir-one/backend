import { APP_PROPOSAL } from '@deip/constants';
import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectInviteDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.PROJECT_INVITE_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.PROJECT_INVITE_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const joinProjectCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime, creator: inviter } = proposalCmd.getCmdPayload();
    const { member: invitee, teamId, notes, projectId } = joinProjectCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!invitee, `'invitee' is required`);
    assert(!!inviter, `'inviter' is required`);
    assert(!!teamId, `'teamId' is required`);
    assert(!!projectId, `'projectId' is required`);

    super(APP_EVENT.PROJECT_INVITE_DECLINED, {
      proposalId,
      expirationTime,
      invitee,
      teamId,
      notes,
      projectId,
      inviter,
      proposalCtx
    });
  }

}


module.exports = ProjectInviteDeclinedEvent;