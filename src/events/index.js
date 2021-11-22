import ProjectCreatedEvent from './impl/ProjectCreatedEvent';
import ProjectUpdatedEvent from './impl/ProjectUpdatedEvent';
import ProjectDeletedEvent from './impl/ProjectDeletedEvent';
import TeamMemberJoinedEvent from './impl/TeamMemberJoinedEvent';
import TeamMemberLeftEvent from './impl/TeamMemberLeftEvent';

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

import TeamInviteCreatedEvent from './impl/TeamInviteCreatedEvent';
import TeamInviteAcceptedEvent from './impl/TeamInviteAcceptedEvent';
import TeamInviteDeclinedEvent from './impl/TeamInviteDeclinedEvent';

import AttributeCreatedEvent from './impl/AttributeCreatedEvent';
import AttributeUpdatedEvent from './impl/AttributeUpdatedEvent';
import AttributeDeletedEvent from './impl/AttributeDeletedEvent';

import UserUpdatedEvent from './impl/UserUpdatedEvent';
import UserAuthorityAlteredEvent from './impl/UserAuthorityAlteredEvent';
import UserCreatedEvent from './impl/UserCreatedEvent';

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

import AttributeSettingsUpdatedEvent from './impl/AttributeSettingsUpdatedEvent';
import LayoutSettingsUpdatedEvent from './impl/LayoutSettingsUpdatedEvent';
import LayoutUpdatedEvent from './impl/LayoutUpdatedEvent';
import NetworkSettingsUpdatedEvent from './impl/NetworkSettingsUpdatedEvent';
import PortalProfileUpdatedEvent from './impl/PortalProfileUpdatedEvent';
import PortalSettingsUpdatedEvent from './impl/PortalSettingsUpdatedEvent';

import UserProfileDeletedEvent from './impl/UserProfileDeletedEvent';


module.exports = {
  ProjectCreatedEvent,
  ProjectUpdatedEvent,
  ProjectDeletedEvent,
  TeamMemberJoinedEvent,
  TeamMemberLeftEvent,

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
  
  TeamInviteCreatedEvent,
  TeamInviteAcceptedEvent,
  TeamInviteDeclinedEvent,

  TeamUpdateProposalAcceptedEvent,
  TeamUpdateProposalCreatedEvent,
  TeamUpdateProposalDeclinedEvent,

  AttributeCreatedEvent,
  AttributeUpdatedEvent,
  AttributeDeletedEvent,

  UserUpdatedEvent,
  UserAuthorityAlteredEvent,
  UserCreatedEvent,
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

  AttributeSettingsUpdatedEvent,
  LayoutSettingsUpdatedEvent,
  LayoutUpdatedEvent,
  NetworkSettingsUpdatedEvent,
  PortalProfileUpdatedEvent,
  PortalSettingsUpdatedEvent
}