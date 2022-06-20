import { APP_EVENT } from '@deip/constants';
import BaseEvent from '../base/BaseEvent';


class NFTLazyBuyProposalDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;
    //TODO: remove when we have onchain market
    super(APP_EVENT.NFT_LAZY_BUY_PROPOSAL_DECLINED, {
      proposalCmd,
      proposalCtx
    });
  }

}


module.exports = NFTLazyBuyProposalDeclinedEvent;