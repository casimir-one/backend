import { APP_PROPOSAL } from '@deip/constants';
import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';


class TeamLeavingCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const { 
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.LEAVE_TEAM_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.LEAVE_TEAM_PROPOSAL} proposal`);
    
    const proposedCmds = proposalCmd.getProposedCmds();
    const joinProjectCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime, creator } = proposalCmd.getCmdPayload();
    const { member, teamId, notes } = joinProjectCmd.getCmdPayload();
    
    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!member, `'member' is required`);
    assert(!!creator, `'creator' is required`);
    assert(!!teamId, `'teamId' is required`);

    super(APP_EVENT.LEAVE_TEAM_CREATED, {
      proposalId,
      expirationTime,
      member,
      teamId,
      notes,
      creator,
      proposalCtx
    });
  }

}


module.exports = TeamLeavingCreatedEvent;