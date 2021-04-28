import ProjectCreatedEvent from './impl/ProjectCreatedEvent';
import ProjectMemberJoinedEvent from './impl/ProjectMemberJoinedEvent';
import TeamCreatedEvent from './impl/TeamCreatedEvent';

import ProposalCreatedEvent from './impl/ProposalCreatedEvent';
import ProposalUpdatedEvent from './impl/ProposalUpdatedEvent';
import ProposalDeclinedEvent from './impl/ProposalDeclinedEvent';

import ProjectProposalCreatedEvent from './impl/ProjectProposalCreatedEvent';
import ProjectProposalAcceptedEvent from './impl/ProjectProposalAcceptedEvent';
import ProjectProposalDeclinedEvent from './impl/ProjectProposalDeclinedEvent';

import ProjectInviteCreatedEvent from './impl/ProjectInviteCreatedEvent';
import ProjectInviteAcceptedEvent from './impl/ProjectInviteAcceptedEvent';
import ProjectInviteDeclinedEvent from './impl/ProjectInviteDeclinedEvent';


module.exports = {
  ProjectCreatedEvent,
  ProjectMemberJoinedEvent,

  TeamCreatedEvent,

  ProposalCreatedEvent,
  ProposalUpdatedEvent,
  ProposalDeclinedEvent,

  ProjectProposalCreatedEvent,
  ProjectProposalAcceptedEvent,
  ProjectProposalDeclinedEvent,

  ProjectInviteCreatedEvent,
  ProjectInviteAcceptedEvent,
  ProjectInviteDeclinedEvent
}