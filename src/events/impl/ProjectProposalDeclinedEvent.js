import BaseEvent from './../base/BaseEvent';
import { APP_PROPOSAL } from '@deip/command-models';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectProposalDeclinedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.PROJECT_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.PROJECT_PROPOSAL} proposal`);
    
    const proposedCmds = proposalCmd.getProposedCmds();
    const createProjectCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime, creator: inviter } = proposalCmd.getCmdPayload();
    const { entityId: projectId, teamId, attributes } = createProjectCmd.getCmdPayload();
    
    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!projectId, `'projectId' is required`);
    assert(!!teamId, `'teamId' is required`);

    super(APP_EVENT.PROJECT_PROPOSAL_DECLINED, {
      proposalId, 
      expirationTime,
      projectId, 
      teamId, 
      attributes,
      proposalCtx 
    });
  }

}


module.exports = ProjectProposalDeclinedEvent;