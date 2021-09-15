import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import { APP_PROPOSAL } from '@deip/constants';
import assert from 'assert';


class ProjectNdaProposalAcceptedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.PROJECT_NDA_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.PROJECT_NDA_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const createProjectNdaCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const {
      entityId: projectNdaId,
      creator,
      parties,
      description,
      projectId,
      startTime,
      endTime
    } = createProjectNdaCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!projectNdaId, "'projectNdaId' is required");
    assert(!!creator, "'creator' is required");
    assert(!!parties && Array.isArray(parties) && parties.length > 0, "'parties' is required");
    assert(!!projectId, "'projectId' is required");
    assert(!!description, "'description' is required");
    assert(!!endTime, "'endTime' is required");

    super(APP_EVENT.PROJECT_NDA_PROPOSAL_CREATED, {
      proposalId,
      expirationTime,
      projectNdaId,
      creator,
      parties,
      description,
      projectId,
      startTime,
      endTime,
      proposalCtx
    });

  }

}


module.exports = ProjectNdaProposalAcceptedEvent;