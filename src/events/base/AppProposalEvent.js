import { APP_PROPOSAL } from '@deip/constants';

import TeamUpdateProposalAcceptedEvent from './../impl/TeamUpdateProposalAcceptedEvent';
import TeamUpdateProposalCreatedEvent from './../impl/TeamUpdateProposalCreatedEvent';
import TeamUpdateProposalDeclinedEvent from './../impl/TeamUpdateProposalDeclinedEvent';

import FTTransferProposalCreatedEvent from '../impl/FTTransferProposalCreatedEvent';
import FTTransferProposalAcceptedEvent from '../impl/FTTransferProposalAcceptedEvent';
import FTTransferProposalDeclinedEvent from '../impl/FTTransferProposalDeclinedEvent';
import NFTTransferProposalCreatedEvent from '../impl/NFTTransferProposalCreatedEvent';
import NFTTransferProposalAcceptedEvent from '../impl/NFTTransferProposalAcceptedEvent';
import NFTTransferProposalDeclinedEvent from '../impl/NFTTransferProposalDeclinedEvent';

import TokenSwapProposalCreatedEvent from '../impl/TokenSwapProposalCreatedEvent';
import TokenSwapProposalAcceptedEvent from '../impl/TokenSwapProposalAcceptedEvent';
import TokenSwapProposalDeclinedEvent from '../impl/TokenSwapProposalDeclinedEvent';

import NFTLazySellProposalCreatedEvent from '../impl/NFTLazySellProposalCreatedEvent';
import NFTLazySellProposalAcceptedEvent from '../impl/NFTLazySellProposalAcceptedEvent';
import NFTLazySellProposalDeclinedEvent from '../impl/NFTLazySellProposalDeclinedEvent';

import NFTLazyBuyProposalCreatedEvent from '../impl/NFTLazyBuyProposalCreatedEvent';
import NFTLazyBuyProposalAcceptedEvent from '../impl/NFTLazyBuyProposalAcceptedEvent';
import NFTLazyBuyProposalDeclinedEvent from '../impl/NFTLazyBuyProposalDeclinedEvent';

module.exports = {
  [APP_PROPOSAL.ADD_DAO_MEMBER_PROPOSAL]: {},
  [APP_PROPOSAL.REMOVE_DAO_MEMBER_PROPOSAL]: {},
  [APP_PROPOSAL.TEAM_UPDATE_PROPOSAL]: {
    CREATED: TeamUpdateProposalCreatedEvent,
    ACCEPTED: TeamUpdateProposalAcceptedEvent,
    DECLINED: TeamUpdateProposalDeclinedEvent
  },
  [APP_PROPOSAL.FT_TRANSFER_PROPOSAL]: {
    CREATED: FTTransferProposalCreatedEvent,
    ACCEPTED: FTTransferProposalAcceptedEvent,
    DECLINED: FTTransferProposalDeclinedEvent
  },
  [APP_PROPOSAL.NFT_TRANSFER_PROPOSAL]: {
    CREATED: NFTTransferProposalCreatedEvent,
    ACCEPTED: NFTTransferProposalAcceptedEvent,
    DECLINED: NFTTransferProposalDeclinedEvent
  },
  [APP_PROPOSAL.TOKENS_SWAP_PROPOSAL]: {
    CREATED: TokenSwapProposalCreatedEvent,
    ACCEPTED: TokenSwapProposalAcceptedEvent,
    DECLINED: TokenSwapProposalDeclinedEvent
  },
  [APP_PROPOSAL.NFT_LAZY_SELL_PROPOSAL]: {
    CREATED: NFTLazySellProposalCreatedEvent,
    ACCEPTED: NFTLazySellProposalAcceptedEvent,
    DECLINED: NFTLazySellProposalDeclinedEvent
  },
  [APP_PROPOSAL.NFT_LAZY_BUY_PROPOSAL]: {
    CREATED: NFTLazyBuyProposalCreatedEvent,
    ACCEPTED: NFTLazyBuyProposalAcceptedEvent,
    DECLINED: NFTLazyBuyProposalDeclinedEvent
  },
}