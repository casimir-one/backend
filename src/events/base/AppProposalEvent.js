import { APP_PROPOSAL } from '@deip/command-models';

import ProjectProposalCreatedEvent from './../impl/ProjectProposalCreatedEvent';
import ProjectProposalAcceptedEvent from './../impl/ProjectProposalAcceptedEvent';
import ProjectProposalDeclinedEvent from './../impl/ProjectProposalDeclinedEvent';

import ProjectUpdateProposalCreatedEvent from './../impl/ProjectUpdateProposalCreatedEvent';
import ProjectUpdateProposalAcceptedEvent from './../impl/ProjectUpdateProposalAcceptedEvent';
import ProjectUpdateProposalDeclinedEvent from './../impl/ProjectUpdateProposalDeclinedEvent';

import ProjectInviteCreatedEvent from './../impl/ProjectInviteCreatedEvent';
import ProjectInviteAcceptedEvent from './../impl/ProjectInviteAcceptedEvent';
import ProjectInviteDeclinedEvent from './../impl/ProjectInviteDeclinedEvent';

import TeamUpdateProposalAcceptedEvent from './../impl/TeamUpdateProposalAcceptedEvent';
import TeamUpdateProposalCreatedEvent from './../impl/TeamUpdateProposalCreatedEvent';
import TeamUpdateProposalDeclinedEvent from './../impl/TeamUpdateProposalDeclinedEvent';

import ProjectTokenSaleProposalCreatedEvent from './../impl/ProjectTokenSaleProposalCreatedEvent';
import ProjectTokenSaleProposalAcceptedEvent from './../impl/ProjectTokenSaleProposalAcceptedEvent';
import ProjectTokenSaleProposalDeclinedEvent from './../impl/ProjectTokenSaleProposalDeclinedEvent';

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
  },
  [APP_PROPOSAL.PROJECT_UPDATE_PROPOSAL]: {
    CREATED: ProjectUpdateProposalCreatedEvent,
    ACCEPTED: ProjectUpdateProposalAcceptedEvent,
    DECLINED: ProjectUpdateProposalDeclinedEvent
  },
  [APP_PROPOSAL.TEAM_UPDATE_PROPOSAL]: {
    CREATED: TeamUpdateProposalCreatedEvent,
    ACCEPTED: TeamUpdateProposalAcceptedEvent,
    DECLINED: TeamUpdateProposalDeclinedEvent
  },
  [APP_PROPOSAL.PROJECT_TOKEN_SALE_PROPOSAL]: {
    CREATED: ProjectTokenSaleProposalCreatedEvent,
    ACCEPTED: ProjectTokenSaleProposalAcceptedEvent,
    DECLINED: ProjectTokenSaleProposalDeclinedEvent
  }
}