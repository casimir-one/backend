import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import { APP_PROPOSAL } from '@deip/constants';
import assert from 'assert';


class TeamUpdateProposalAcceptedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.TEAM_UPDATE_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.TEAM_UPDATE_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const updateTeamCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const { entityId: teamId, attributes } = updateTeamCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!teamId, `'teamId' is required`);

    super(APP_EVENT.TEAM_UPDATE_PROPOSAL_ACCEPTED, {
      proposalId,
      expirationTime,
      teamId,
      attributes,
      proposalCtx
    });

  }

}


module.exports = TeamUpdateProposalAcceptedEvent;