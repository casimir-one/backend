import { APP_EVENT } from '@casimir.one/platform-core';
import BaseEvent from '../base/BaseEvent';


class NFTLazyBuyProposalAcceptedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;
    //TODO: Remove when we have onchain market

    const { entityId: proposalId, expirationTime, proposedCmds } = proposalCmd.getCmdPayload();

    super(APP_EVENT.NFT_LAZY_BUY_PROPOSAL_ACCEPTED, {
      proposalId,
      proposalCmd,
      proposalCtx
    });

  }

}


module.exports = NFTLazyBuyProposalAcceptedEvent;