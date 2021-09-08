import { APP_PROPOSAL } from '@deip/constants';

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

import AssetTransferProposalCreatedEvent from './../impl/AssetTransferProposalCreatedEvent';
import AssetTransferProposalAcceptedEvent from './../impl/AssetTransferProposalAcceptedEvent';
import AssetTransferProposalDeclinedEvent from './../impl/AssetTransferProposalDeclinedEvent';

import AssetExchangeProposalCreatedEvent from './../impl/AssetExchangeProposalCreatedEvent';
import AssetExchangeProposalAcceptedEvent from './../impl/AssetExchangeProposalAcceptedEvent';
import AssetExchangeProposalDeclinedEvent from './../impl/AssetExchangeProposalDeclinedEvent';

import ProjectContentProposalCreatedEvent from './../impl/ProjectContentProposalCreatedEvent';
import ProjectContentProposalAcceptedEvent from './../impl/ProjectContentProposalAcceptedEvent';
import ProjectContentProposalDeclinedEvent from './../impl/ProjectContentProposalDeclinedEvent';

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
  },
  [APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL]: {
    CREATED: AssetTransferProposalCreatedEvent,
    ACCEPTED: AssetTransferProposalAcceptedEvent,
    DECLINED: AssetTransferProposalDeclinedEvent
  },
  [APP_PROPOSAL.ASSET_EXCHANGE_PROPOSAL]: {
    CREATED: AssetExchangeProposalCreatedEvent,
    ACCEPTED: AssetExchangeProposalAcceptedEvent,
    DECLINED: AssetExchangeProposalDeclinedEvent
  },
  [APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL]: {
    CREATED: ProjectContentProposalCreatedEvent,
    ACCEPTED: ProjectContentProposalAcceptedEvent,
    DECLINED: ProjectContentProposalDeclinedEvent
  }
}