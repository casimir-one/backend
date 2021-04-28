import { APP_PROPOSAL } from '@deip/command-models';

import ProjectProposalCreatedEvent from './../impl/ProjectProposalCreatedEvent';
import ProjectProposalAcceptedEvent from './../impl/ProjectProposalAcceptedEvent';
import ProjectProposalDeclinedEvent from './../impl/ProjectProposalDeclinedEvent';

import ProjectInviteCreatedEvent from './../impl/ProjectInviteCreatedEvent';
import ProjectInviteAcceptedEvent from './../impl/ProjectInviteAcceptedEvent';
import ProjectInviteDeclinedEvent from './../impl/ProjectInviteDeclinedEvent';


module.exports = {
  [APP_PROPOSAL.PROJECT_INVITE_PROPOSAL]: {
    CREATED: ProjectInviteCreatedEvent,
    ACCEPTED: ProjectInviteAcceptedEvent,
    DECLINED: ProjectInviteDeclinedEvent
  },
  [APP_PROPOSAL.PROJECT_PROPOSAL]: {
    CREATED: ProjectProposalCreatedEvent,
    ACCEPTED: ProjectProposalAcceptedEvent,
    DECLINED: ProjectProposalDeclinedEvent
  }
}