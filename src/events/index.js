import ProjectCreatedEvent from './impl/ProjectCreatedEvent';
import ProjectUpdatedEvent from './impl/ProjectUpdatedEvent';
import ProjectDeletedEvent from './impl/ProjectDeletedEvent';
import DaoMemberAddedEvent from './impl/DaoMemberAddedEvent';
import DaoMemberRemovedEvent from './impl/DaoMemberRemovedEvent';

import TeamUpdateProposalCreatedEvent from './impl/TeamUpdateProposalCreatedEvent';
import TeamUpdateProposalAcceptedEvent from './impl/TeamUpdateProposalAcceptedEvent';
import TeamUpdateProposalDeclinedEvent from './impl/TeamUpdateProposalDeclinedEvent';

import ProposalCreatedEvent from './impl/ProposalCreatedEvent';
import ProposalAcceptedEvent from './impl/ProposalAcceptedEvent';
import ProposalDeclinedEvent from './impl/ProposalDeclinedEvent';

import ProjectProposalCreatedEvent from './impl/ProjectProposalCreatedEvent';
import ProjectProposalAcceptedEvent from './impl/ProjectProposalAcceptedEvent';
import ProjectProposalDeclinedEvent from './impl/ProjectProposalDeclinedEvent';

import ProjectUpdateProposalCreatedEvent from './impl/ProjectUpdateProposalCreatedEvent';
import ProjectUpdateProposalAcceptedEvent from './impl/ProjectUpdateProposalAcceptedEvent';
import ProjectUpdateProposalDeclinedEvent from './impl/ProjectUpdateProposalDeclinedEvent';

import TeamInviteCreatedEvent from './impl/TeamInviteCreatedEvent';
import TeamInviteAcceptedEvent from './impl/TeamInviteAcceptedEvent';
import TeamInviteDeclinedEvent from './impl/TeamInviteDeclinedEvent';

import AttributeCreatedEvent from './impl/AttributeCreatedEvent';
import AttributeUpdatedEvent from './impl/AttributeUpdatedEvent';
import AttributeDeletedEvent from './impl/AttributeDeletedEvent';

import UserAuthorityAlteredEvent from './impl/UserAuthorityAlteredEvent';
import DaoCreatedEvent from './impl/DaoCreatedEvent';
import DaoUpdatedEvent from './impl/DaoUpdatedEvent';

import ProjectTokenSaleProposalCreatedEvent from './impl/ProjectTokenSaleProposalCreatedEvent';
import ProjectTokenSaleProposalAcceptedEvent from './impl/ProjectTokenSaleProposalAcceptedEvent';
import ProjectTokenSaleProposalDeclinedEvent from './impl/ProjectTokenSaleProposalDeclinedEvent';

import InvestmentOpportunityCreatedEvent from './impl/InvestmentOpportunityCreatedEvent';
import InvestmentOpportunityParticipatedEvent from './impl/InvestmentOpportunityParticipatedEvent';

import AssetTransferedEvent from './impl/AssetTransferedEvent';
import AssetCreatedEvent from './impl/AssetCreatedEvent';
import AssetIssuedEvent from './impl/AssetIssuedEvent';
import AssetTransferProposalCreatedEvent from './impl/AssetTransferProposalCreatedEvent';
import AssetTransferProposalAcceptedEvent from './impl/AssetTransferProposalAcceptedEvent';
import AssetTransferProposalDeclinedEvent from './impl/AssetTransferProposalDeclinedEvent';
import AssetExchangeProposalCreatedEvent from './impl/AssetExchangeProposalCreatedEvent';
import AssetExchangeProposalAcceptedEvent from './impl/AssetExchangeProposalAcceptedEvent';
import AssetExchangeProposalDeclinedEvent from './impl/AssetExchangeProposalDeclinedEvent';

import DocumentTemplateCreatedEvent from './impl/DocumentTemplateCreatedEvent';
import DocumentTemplateUpdatedEvent from './impl/DocumentTemplateUpdatedEvent';
import DocumentTemplateDeletedEvent from './impl/DocumentTemplateDeletedEvent';

import ProjectContentDraftCreatedEvent from './impl/ProjectContentDraftCreatedEvent';
import ProjectContentDraftDeletedEvent from './impl/ProjectContentDraftDeletedEvent';
import ProjectContentDraftUpdatedEvent from './impl/ProjectContentDraftUpdatedEvent';
import ProjectContentCreatedEvent from './impl/ProjectContentCreatedEvent';

import ReviewRequestCreatedEvent from './impl/ReviewRequestCreatedEvent';
import ReviewRequestDeclinedEvent from './impl/ReviewRequestDeclinedEvent';
import ReviewCreatedEvent from './impl/ReviewCreatedEvent';
import UpvotedReviewEvent from './impl/UpvotedReviewEvent';

import ProjectNdaCreatedEvent from './impl/ProjectNdaCreatedEvent';
import ProjectNdaProposalCreatedEvent from './impl/ProjectNdaProposalCreatedEvent';
import ProjectNdaProposalAcceptedEvent from './impl/ProjectNdaProposalAcceptedEvent';
import ProjectNdaProposalDeclinedEvent from './impl/ProjectNdaProposalDeclinedEvent';

import ContractAgreementCreatedEvent from './impl/ContractAgreementCreatedEvent';
import ContractAgreementProposalCreatedEvent from './impl/ContractAgreementProposalCreatedEvent';
import ContractAgreementProposalAcceptedEvent from './impl/ContractAgreementProposalAcceptedEvent';
import ContractAgreementProposalDeclinedEvent from './impl/ContractAgreementProposalDeclinedEvent';
import ContractAgreementAcceptedEvent from './impl/ContractAgreementAcceptedEvent';
import ContractAgreementRejectedEvent from './impl/ContractAgreementRejectedEvent';

import AttributeSettingsUpdatedEvent from './impl/AttributeSettingsUpdatedEvent';
import LayoutSettingsUpdatedEvent from './impl/LayoutSettingsUpdatedEvent';
import LayoutUpdatedEvent from './impl/LayoutUpdatedEvent';
import NetworkSettingsUpdatedEvent from './impl/NetworkSettingsUpdatedEvent';
import PortalProfileUpdatedEvent from './impl/PortalProfileUpdatedEvent';
import PortalSettingsUpdatedEvent from './impl/PortalSettingsUpdatedEvent';

import UserProfileDeletedEvent from './impl/UserProfileDeletedEvent';

import BookmarkCreatedEvent from './impl/BookmarkCreatedEvent';
import BookmarkDeletedEvent from './impl/BookmarkDeletedEvent';
import NotificationsMarkedAsReadEvent from './impl/NotificationsMarkedAsReadEvent';

module.exports = {
  ProjectCreatedEvent,
  ProjectUpdatedEvent,
  ProjectDeletedEvent,
  DaoMemberAddedEvent,
  DaoMemberRemovedEvent,

  ProposalCreatedEvent,
  ProposalAcceptedEvent,
  ProposalDeclinedEvent,

  ProjectProposalCreatedEvent,
  ProjectProposalAcceptedEvent,
  ProjectProposalDeclinedEvent,

  ProjectUpdateProposalCreatedEvent,
  ProjectUpdateProposalAcceptedEvent,
  ProjectUpdateProposalDeclinedEvent,
  
  TeamInviteCreatedEvent,
  TeamInviteAcceptedEvent,
  TeamInviteDeclinedEvent,

  TeamUpdateProposalAcceptedEvent,
  TeamUpdateProposalCreatedEvent,
  TeamUpdateProposalDeclinedEvent,

  AttributeCreatedEvent,
  AttributeUpdatedEvent,
  AttributeDeletedEvent,

  DaoCreatedEvent,
  DaoUpdatedEvent,

  UserAuthorityAlteredEvent,
  UserProfileDeletedEvent,

  ProjectTokenSaleProposalCreatedEvent,
  ProjectTokenSaleProposalAcceptedEvent,
  ProjectTokenSaleProposalDeclinedEvent,

  InvestmentOpportunityCreatedEvent,
  InvestmentOpportunityParticipatedEvent,

  AssetTransferedEvent,
  AssetCreatedEvent,
  AssetIssuedEvent,
  AssetTransferProposalCreatedEvent,
  AssetTransferProposalAcceptedEvent,
  AssetTransferProposalDeclinedEvent,
  AssetExchangeProposalCreatedEvent,
  AssetExchangeProposalAcceptedEvent,
  AssetExchangeProposalDeclinedEvent,

  DocumentTemplateCreatedEvent,
  DocumentTemplateUpdatedEvent,
  DocumentTemplateDeletedEvent,

  ProjectContentDraftCreatedEvent,
  ProjectContentDraftDeletedEvent,
  ProjectContentDraftUpdatedEvent,
  ProjectContentCreatedEvent,

  ReviewRequestCreatedEvent,
  ReviewRequestDeclinedEvent,
  ReviewCreatedEvent,
  UpvotedReviewEvent,

  ProjectNdaCreatedEvent,
  ProjectNdaProposalCreatedEvent,
  ProjectNdaProposalAcceptedEvent,
  ProjectNdaProposalDeclinedEvent,

  ContractAgreementCreatedEvent,
  ContractAgreementProposalCreatedEvent,
  ContractAgreementProposalAcceptedEvent,
  ContractAgreementProposalDeclinedEvent,
  ContractAgreementAcceptedEvent,
  ContractAgreementRejectedEvent,

  AttributeSettingsUpdatedEvent,
  LayoutSettingsUpdatedEvent,
  LayoutUpdatedEvent,
  NetworkSettingsUpdatedEvent,
  PortalProfileUpdatedEvent,
  PortalSettingsUpdatedEvent,

  BookmarkCreatedEvent,
  BookmarkDeletedEvent,
  NotificationsMarkedAsReadEvent
}