import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import { APP_PROPOSAL } from '@deip/constants';
import assert from 'assert';


class ProjectUpdateProposalCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.PROJECT_UPDATE_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.PROJECT_UPDATE_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const updateProjectCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const { entityId: projectId, teamId, attributes } = updateProjectCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!projectId, `'projectId' is required`);
    assert(!!teamId, `'teamId' is required`);

    super(APP_EVENT.PROJECT_UPDATE_PROPOSAL_CREATED, {
      proposalId,
      expirationTime,
      projectId,
      teamId,
      attributes,
      proposalCtx
    });

  }

}


module.exports = ProjectUpdateProposalCreatedEvent;