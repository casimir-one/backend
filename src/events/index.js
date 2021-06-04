import ProjectCreatedEvent from './impl/ProjectCreatedEvent';
import ProjectUpdatedEvent from './impl/ProjectUpdatedEvent';
import ProjectDeletedEvent from './impl/ProjectDeletedEvent';
import ProjectMemberJoinedEvent from './impl/ProjectMemberJoinedEvent';

import TeamCreatedEvent from './impl/TeamCreatedEvent';
import TeamUpdatedEvent from './impl/TeamUpdatedEvent';
import TeamUpdateProposalCreatedEvent from './impl/TeamUpdateProposalCreatedEvent';
import TeamUpdateProposalAcceptedEvent from './impl/TeamUpdateProposalAcceptedEvent';
import TeamUpdateProposalDeclinedEvent from './impl/TeamUpdateProposalDeclinedEvent';

import ProposalCreatedEvent from './impl/ProposalCreatedEvent';
import ProposalUpdatedEvent from './impl/ProposalUpdatedEvent';
import ProposalDeclinedEvent from './impl/ProposalDeclinedEvent';

import ProjectProposalCreatedEvent from './impl/ProjectProposalCreatedEvent';
import ProjectProposalAcceptedEvent from './impl/ProjectProposalAcceptedEvent';
import ProjectProposalDeclinedEvent from './impl/ProjectProposalDeclinedEvent';

import ProjectUpdateProposalCreatedEvent from './impl/ProjectUpdateProposalCreatedEvent';
import ProjectUpdateProposalAcceptedEvent from './impl/ProjectUpdateProposalAcceptedEvent';
import ProjectUpdateProposalDeclinedEvent from './impl/ProjectUpdateProposalDeclinedEvent';

import ProjectInviteCreatedEvent from './impl/ProjectInviteCreatedEvent';
import ProjectInviteAcceptedEvent from './impl/ProjectInviteAcceptedEvent';
import ProjectInviteDeclinedEvent from './impl/ProjectInviteDeclinedEvent';

import AttributeCreatedEvent from './impl/AttributeCreatedEvent';
import AttributeUpdatedEvent from './impl/AttributeUpdatedEvent';
import AttributeDeletedEvent from './impl/AttributeDeletedEvent';

import UserUpdatedEvent from './impl/UserUpdatedEvent';
import UserCreatedEvent from './impl/UserCreatedEvent';

module.exports = {
  ProjectCreatedEvent,
  ProjectUpdatedEvent,
  ProjectDeletedEvent,
  ProjectMemberJoinedEvent,

  TeamCreatedEvent,
  TeamUpdatedEvent,

  ProposalCreatedEvent,
  ProposalUpdatedEvent,
  ProposalDeclinedEvent,

  ProjectProposalCreatedEvent,
  ProjectProposalAcceptedEvent,
  ProjectProposalDeclinedEvent,

  ProjectUpdateProposalCreatedEvent,
  ProjectUpdateProposalAcceptedEvent,
  ProjectUpdateProposalDeclinedEvent,
  
  ProjectInviteCreatedEvent,
  ProjectInviteAcceptedEvent,
  ProjectInviteDeclinedEvent,

  TeamUpdateProposalAcceptedEvent,
  TeamUpdateProposalCreatedEvent,
  TeamUpdateProposalDeclinedEvent,

  AttributeCreatedEvent,
  AttributeUpdatedEvent,
  AttributeDeletedEvent,

  UserUpdatedEvent,
  UserCreatedEvent
}