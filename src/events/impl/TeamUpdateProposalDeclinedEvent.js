import BaseEvent from './../base/BaseEvent';
import { APP_PROPOSAL, APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class TeamUpdateProposalDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.TEAM_UPDATE_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.TEAM_UPDATE_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const updateTeamCmd = proposedCmds[0];
    const { _id: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const { _id: teamId, attributes } = updateTeamCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!teamId, `'teamId' is required`);

    super(APP_EVENT.TEAM_UPDATE_PROPOSAL_DECLINED, {
      proposalId,
      expirationTime,
      teamId,
      attributes,
      proposalCtx
    });
  }

}


module.exports = TeamUpdateProposalDeclinedEvent;