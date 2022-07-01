import { APP_EVENT } from '@casimir/platform-core';
import BaseEvent from '../base/BaseEvent';


class NFTLazySellProposalAcceptedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;
    //TODO: remove when we have onchain market

    const { entityId: proposalId, expirationTime, proposedCmds } = proposalCmd.getCmdPayload();

    super(APP_EVENT.NFT_LAZY_SELL_PROPOSAL_ACCEPTED, {
      proposalId,
      proposalCmd,
      proposalCtx
    });

  }

}


module.exports = NFTLazySellProposalAcceptedEvent;