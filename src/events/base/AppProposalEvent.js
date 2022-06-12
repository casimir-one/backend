import { APP_PROPOSAL } from '@deip/constants';

import TeamInviteCreatedEvent from './../impl/TeamInviteCreatedEvent';
import TeamInviteAcceptedEvent from './../impl/TeamInviteAcceptedEvent';
import TeamInviteDeclinedEvent from './../impl/TeamInviteDeclinedEvent';

import TeamLeavingCreatedEvent from '../impl/TeamLeavingCreatedEvent';
import TeamLeavingAcceptedEvent from '../impl/TeamLeavingAcceptedEvent';
import TeamLeavingDeclinedEvent from '../impl/TeamLeavingDeclinedEvent';

import TeamUpdateProposalAcceptedEvent from './../impl/TeamUpdateProposalAcceptedEvent';
import TeamUpdateProposalCreatedEvent from './../impl/TeamUpdateProposalCreatedEvent';
import TeamUpdateProposalDeclinedEvent from './../impl/TeamUpdateProposalDeclinedEvent';

import FungibleTokenTransferProposalCreatedEvent from './../impl/FungibleTokenTransferProposalCreatedEvent';
import FungibleTokenTransferProposalAcceptedEvent from '../impl/FungibleTokenTransferProposalAcceptedEvent';
import FungibleTokenTransferProposalDeclinedEvent from '../impl/FungibleTokenTransferProposalDeclinedEvent';
import NonFungibleTokenTransferProposalCreatedEvent from './../impl/NonFungibleTokenTransferProposalCreatedEvent';
import NonFungibleTokenTransferProposalAcceptedEvent from '../impl/NonFungibleTokenTransferProposalAcceptedEvent';
import NonFungibleTokenTransferProposalDeclinedEvent from '../impl/NonFungibleTokenTransferProposalDeclinedEvent';

import TokenSwapProposalCreatedEvent from '../impl/TokenSwapProposalCreatedEvent';
import TokenSwapProposalAcceptedEvent from '../impl/TokenSwapProposalAcceptedEvent';
import TokenSwapProposalDeclinedEvent from '../impl/TokenSwapProposalDeclinedEvent';


module.exports = {
  [APP_PROPOSAL.ADD_DAO_MEMBER_PROPOSAL]: {
    CREATED: TeamInviteCreatedEvent,
    ACCEPTED: TeamInviteAcceptedEvent,
    DECLINED: TeamInviteDeclinedEvent
  },
  [APP_PROPOSAL.REMOVE_DAO_MEMBER_PROPOSAL]: {
    CREATED: TeamLeavingCreatedEvent,
    ACCEPTED: TeamLeavingAcceptedEvent,
    DECLINED: TeamLeavingDeclinedEvent
  },
  [APP_PROPOSAL.TEAM_UPDATE_PROPOSAL]: {
    CREATED: TeamUpdateProposalCreatedEvent,
    ACCEPTED: TeamUpdateProposalAcceptedEvent,
    DECLINED: TeamUpdateProposalDeclinedEvent
  },
  [APP_PROPOSAL.FT_TRANSFER_PROPOSAL]: {
    CREATED: FungibleTokenTransferProposalCreatedEvent,
    ACCEPTED: FungibleTokenTransferProposalAcceptedEvent,
    DECLINED: FungibleTokenTransferProposalDeclinedEvent
  },
  [APP_PROPOSAL.NFT_TRANSFER_PROPOSAL]: {
    CREATED: NonFungibleTokenTransferProposalCreatedEvent,
    ACCEPTED: NonFungibleTokenTransferProposalAcceptedEvent,
    DECLINED: NonFungibleTokenTransferProposalDeclinedEvent
  },
  [APP_PROPOSAL.TOKENS_SWAP_PROPOSAL]: {
    CREATED: TokenSwapProposalCreatedEvent,
    ACCEPTED: TokenSwapProposalAcceptedEvent,
    DECLINED: TokenSwapProposalDeclinedEvent
  }
}