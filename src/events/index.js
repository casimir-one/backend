import NftCollectionMetadataCreatedEvent from './impl/NftCollectionMetadataCreatedEvent';
import NftCollectionMetadataUpdatedEvent from './impl/NftCollectionMetadataUpdatedEvent';
import DaoMemberAddedEvent from './impl/DaoMemberAddedEvent';
import DaoMemberRemovedEvent from './impl/DaoMemberRemovedEvent';

import TeamUpdateProposalCreatedEvent from './impl/TeamUpdateProposalCreatedEvent';
import TeamUpdateProposalAcceptedEvent from './impl/TeamUpdateProposalAcceptedEvent';
import TeamUpdateProposalDeclinedEvent from './impl/TeamUpdateProposalDeclinedEvent';

import ProposalCreatedEvent from './impl/ProposalCreatedEvent';
import ProposalAcceptedEvent from './impl/ProposalAcceptedEvent';
import ProposalDeclinedEvent from './impl/ProposalDeclinedEvent';

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

import FungibleTokenTransferedEvent from './impl/FungibleTokenTransferedEvent';
import NonFungibleTokenTransferedEvent from './impl/NonFungibleTokenTransferedEvent';
import FungibleTokenCreatedEvent from './impl/FungibleTokenCreatedEvent';
import NftCollectionCreatedEvent from './impl/NftCollectionCreatedEvent';
import FungibleTokenIssuedEvent from './impl/FungibleTokenIssuedEvent';
import NftItemIssuedEvent from './impl/NftItemIssuedEvent';
import FungibleTokenTransferProposalCreatedEvent from './impl/FungibleTokenTransferProposalCreatedEvent';
import FungibleTokenTransferProposalAcceptedEvent from './impl/FungibleTokenTransferProposalAcceptedEvent';
import FungibleTokenTransferProposalDeclinedEvent from './impl/FungibleTokenTransferProposalDeclinedEvent';
import NonFungibleTokenTransferProposalCreatedEvent from './impl/NonFungibleTokenTransferProposalCreatedEvent';
import NonFungibleTokenTransferProposalAcceptedEvent from './impl/NonFungibleTokenTransferProposalAcceptedEvent';
import NonFungibleTokenTransferProposalDeclinedEvent from './impl/NonFungibleTokenTransferProposalDeclinedEvent';
import TokenSwapProposalCreatedEvent from './impl/TokenSwapProposalCreatedEvent';
import TokenSwapProposalAcceptedEvent from './impl/TokenSwapProposalAcceptedEvent';
import TokenSwapProposalDeclinedEvent from './impl/TokenSwapProposalDeclinedEvent';

import DocumentTemplateCreatedEvent from './impl/DocumentTemplateCreatedEvent';
import DocumentTemplateUpdatedEvent from './impl/DocumentTemplateUpdatedEvent';
import DocumentTemplateDeletedEvent from './impl/DocumentTemplateDeletedEvent';

import NftItemMetadataDraftModerationMsgUpdatedEvent from './impl/NftItemMetadataDraftModerationMsgUpdatedEvent';
import NftItemMetadataDraftStatusUpdatedEvent from './impl/NftItemMetadataDraftStatusUpdatedEvent';
import NftItemMetadataDraftCreatedEvent from './impl/NftItemMetadataDraftCreatedEvent';
import NftItemMetadataDraftDeletedEvent from './impl/NftItemMetadataDraftDeletedEvent';
import NftItemMetadataDraftUpdatedEvent from './impl/NftItemMetadataDraftUpdatedEvent';
import NftItemMetadataCreatedEvent from './impl/NftItemMetadataCreatedEvent';

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
import NetworkSettingsUpdatedEvent from './impl/NetworkSettingsUpdatedEvent';
import PortalProfileUpdatedEvent from './impl/PortalProfileUpdatedEvent';
import PortalSettingsUpdatedEvent from './impl/PortalSettingsUpdatedEvent';

import UserProfileDeletedEvent from './impl/UserProfileDeletedEvent';

import BookmarkCreatedEvent from './impl/BookmarkCreatedEvent';
import BookmarkDeletedEvent from './impl/BookmarkDeletedEvent';
import NotificationsMarkedAsReadEvent from './impl/NotificationsMarkedAsReadEvent';

import LayoutCreatedEvent from './impl/LayoutCreatedEvent';
import LayoutUpdatedEvent from './impl/LayoutUpdatedEvent';
import LayoutDeletedEvent from './impl/LayoutDeletedEvent';

import RegistrationCodeSendedByEmailEvent from './impl/RegistrationCodeSendedByEmailEvent';

module.exports = {
  NftCollectionMetadataCreatedEvent,
  NftCollectionMetadataUpdatedEvent,
  DaoMemberAddedEvent,
  DaoMemberRemovedEvent,

  ProposalCreatedEvent,
  ProposalAcceptedEvent,
  ProposalDeclinedEvent,
  
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

  FungibleTokenTransferedEvent,
  NonFungibleTokenTransferedEvent,
  FungibleTokenCreatedEvent,
  NftCollectionCreatedEvent,
  FungibleTokenIssuedEvent,
  NftItemIssuedEvent,
  FungibleTokenTransferProposalCreatedEvent,
  FungibleTokenTransferProposalAcceptedEvent,
  FungibleTokenTransferProposalDeclinedEvent,
  NonFungibleTokenTransferProposalCreatedEvent,
  NonFungibleTokenTransferProposalAcceptedEvent,
  NonFungibleTokenTransferProposalDeclinedEvent,
  TokenSwapProposalCreatedEvent,
  TokenSwapProposalAcceptedEvent,
  TokenSwapProposalDeclinedEvent,

  DocumentTemplateCreatedEvent,
  DocumentTemplateUpdatedEvent,
  DocumentTemplateDeletedEvent,

  NftItemMetadataDraftModerationMsgUpdatedEvent,
  NftItemMetadataDraftStatusUpdatedEvent,
  NftItemMetadataDraftCreatedEvent,
  NftItemMetadataDraftDeletedEvent,
  NftItemMetadataDraftUpdatedEvent,
  NftItemMetadataCreatedEvent,

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
  NetworkSettingsUpdatedEvent,
  PortalProfileUpdatedEvent,
  PortalSettingsUpdatedEvent,

  BookmarkCreatedEvent,
  BookmarkDeletedEvent,
  NotificationsMarkedAsReadEvent,

  LayoutCreatedEvent,
  LayoutUpdatedEvent,
  LayoutDeletedEvent,

  RegistrationCodeSendedByEmailEvent
}