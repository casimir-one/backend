import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import { APP_PROPOSAL } from '@deip/constants';
import assert from 'assert';


class ProjectContentProposalDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const createProjectContentCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime, creator } = proposalCmd.getCmdPayload();
    const { entityId, projectId, teamId, content, contentType, authors, title } = createProjectContentCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!entityId, `'entityId' is required`);
    assert(!!projectId, `'projectId' is required`);
    assert(!!teamId, `'teamId' is required`);
    assert(!!content, `'content' is required`);
    assert(!!contentType, `'contentType' is required`);
    assert(!!authors && authors.length, `'authors' is required`);
    assert(!!title, `'title' is required`);

    super(APP_EVENT.PROJECT_CONTENT_PROPOSAL_DECLINED, {
      proposalId,
      expirationTime,
      projectId,
      entityId,
      teamId,
      content,
      contentType,
      authors,
      title,
      proposalCtx,
      creator
    });

  }

}


module.exports = ProjectContentProposalDeclinedEvent;