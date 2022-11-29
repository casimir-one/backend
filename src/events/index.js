import NFTCollectionCreatedEvent from './impl/NFTCollectionCreatedEvent';
import NFTCollectionUpdatedEvent from './impl/NFTCollectionUpdatedEvent';
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
import DAOImportedEvent from './impl/DAOImportedEvent';
import DaoUpdatedEvent from './impl/DaoUpdatedEvent';

import FTTransferredEvent from './impl/FTTransferredEvent';
import NFTTransferredEvent from './impl/NFTTransferredEvent';
import FTCreatedEvent from './impl/FTCreatedEvent';
import FTIssuedEvent from './impl/FTIssuedEvent';
import FTTransferProposalCreatedEvent from './impl/FTTransferProposalCreatedEvent';
import FTTransferProposalAcceptedEvent from './impl/FTTransferProposalAcceptedEvent';
import FTTransferProposalDeclinedEvent from './impl/FTTransferProposalDeclinedEvent';
import NFTTransferProposalCreatedEvent from './impl/NFTTransferProposalCreatedEvent';
import NFTTransferProposalAcceptedEvent from './impl/NFTTransferProposalAcceptedEvent';
import NFTTransferProposalDeclinedEvent from './impl/NFTTransferProposalDeclinedEvent';
import TokenSwapProposalCreatedEvent from './impl/TokenSwapProposalCreatedEvent';
import TokenSwapProposalAcceptedEvent from './impl/TokenSwapProposalAcceptedEvent';
import TokenSwapProposalDeclinedEvent from './impl/TokenSwapProposalDeclinedEvent';

import DocumentTemplateCreatedEvent from './impl/DocumentTemplateCreatedEvent';
import DocumentTemplateUpdatedEvent from './impl/DocumentTemplateUpdatedEvent';
import DocumentTemplateDeletedEvent from './impl/DocumentTemplateDeletedEvent';

import NFTItemStatusUpdatedEvent from './impl/NFTItemStatusUpdatedEvent';
import NFTItemCreatedEvent from './impl/NFTItemCreatedEvent';
import NFTItemDeletedEvent from './impl/NFTItemDeletedEvent';
import NFTItemUpdatedEvent from './impl/NFTItemUpdatedEvent';

import AttributeSettingsUpdatedEvent from './impl/AttributeSettingsUpdatedEvent';
import LayoutSettingsUpdatedEvent from './impl/LayoutSettingsUpdatedEvent';
import PortalProfileUpdatedEvent from './impl/PortalProfileUpdatedEvent';
import PortalSettingsUpdatedEvent from './impl/PortalSettingsUpdatedEvent';

import LayoutCreatedEvent from './impl/LayoutCreatedEvent';
import LayoutUpdatedEvent from './impl/LayoutUpdatedEvent';
import LayoutDeletedEvent from './impl/LayoutDeletedEvent';


module.exports = {
  NFTCollectionCreatedEvent,
  NFTCollectionUpdatedEvent,

  NFTItemCreatedEvent,
  NFTItemUpdatedEvent,
  NFTItemDeletedEvent,
  NFTItemStatusUpdatedEvent,

  AttributeCreatedEvent,
  AttributeUpdatedEvent,
  AttributeDeletedEvent,
  AttributeSettingsUpdatedEvent,

  LayoutCreatedEvent,
  LayoutUpdatedEvent,
  LayoutDeletedEvent,
  LayoutSettingsUpdatedEvent,

  ProposalCreatedEvent,
  ProposalAcceptedEvent,
  ProposalDeclinedEvent,

  TeamUpdateProposalAcceptedEvent,
  TeamUpdateProposalCreatedEvent,
  TeamUpdateProposalDeclinedEvent,

  DaoCreatedEvent,
  DaoUpdatedEvent,
  DaoMemberAddedEvent,
  DaoMemberRemovedEvent,
  DAOImportedEvent,

  UserAuthorityAlteredEvent,

  FTTransferredEvent,
  NFTTransferredEvent,
  FTCreatedEvent,
  FTIssuedEvent,
  FTTransferProposalCreatedEvent,
  FTTransferProposalAcceptedEvent,
  FTTransferProposalDeclinedEvent,
  NFTTransferProposalCreatedEvent,
  NFTTransferProposalAcceptedEvent,
  NFTTransferProposalDeclinedEvent,
  TokenSwapProposalCreatedEvent,
  TokenSwapProposalAcceptedEvent,
  TokenSwapProposalDeclinedEvent,

  DocumentTemplateCreatedEvent,
  DocumentTemplateUpdatedEvent,
  DocumentTemplateDeletedEvent,

  PortalProfileUpdatedEvent,
  PortalSettingsUpdatedEvent,
}