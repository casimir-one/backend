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

import AttributeCreatedEvent from './impl/AttributeCreatedEvent';
import AttributeUpdatedEvent from './impl/AttributeUpdatedEvent';
import AttributeDeletedEvent from './impl/AttributeDeletedEvent';

import UserAuthorityAlteredEvent from './impl/UserAuthorityAlteredEvent';
import DaoCreatedEvent from './impl/DaoCreatedEvent';
import DaoUpdatedEvent from './impl/DaoUpdatedEvent';

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

import AttributeSettingsUpdatedEvent from './impl/AttributeSettingsUpdatedEvent';
import LayoutSettingsUpdatedEvent from './impl/LayoutSettingsUpdatedEvent';
import NetworkSettingsUpdatedEvent from './impl/NetworkSettingsUpdatedEvent';
import PortalProfileUpdatedEvent from './impl/PortalProfileUpdatedEvent';
import PortalSettingsUpdatedEvent from './impl/PortalSettingsUpdatedEvent';

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
  
  TeamUpdateProposalAcceptedEvent,
  TeamUpdateProposalCreatedEvent,
  TeamUpdateProposalDeclinedEvent,

  AttributeCreatedEvent,
  AttributeUpdatedEvent,
  AttributeDeletedEvent,

  DaoCreatedEvent,
  DaoUpdatedEvent,

  UserAuthorityAlteredEvent,

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

  AttributeSettingsUpdatedEvent,
  LayoutSettingsUpdatedEvent,
  NetworkSettingsUpdatedEvent,
  PortalProfileUpdatedEvent,
  PortalSettingsUpdatedEvent,

  LayoutCreatedEvent,
  LayoutUpdatedEvent,
  LayoutDeletedEvent,

  RegistrationCodeSendedByEmailEvent
}