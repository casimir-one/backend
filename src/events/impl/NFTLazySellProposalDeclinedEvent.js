import { APP_EVENT } from '@casimir.one/platform-core';
import BaseEvent from '../base/BaseEvent';


class NFTLazySellProposalDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;
    //TODO: remove when we have onchain market

    const { entityId: proposalId, expirationTime, proposedCmds } = proposalCmd.getCmdPayload();

    super(APP_EVENT.NFT_LAZY_SELL_PROPOSAL_DECLINED, {
      proposalId,
      proposalCmd,
      proposalCtx
    });
  }

}


module.exports = NFTLazySellProposalDeclinedEvent;