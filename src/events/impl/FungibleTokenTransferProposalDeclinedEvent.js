import BaseEvent from '../base/BaseEvent';
import { APP_PROPOSAL } from '@deip/constants';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';


class FungibleTokenTransferProposalDeclinedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL} proposal`);
    
    const proposedCmds = proposalCmd.getProposedCmds();
    const transferFungibleTokenCmd = proposedCmds[0];
    const { entityId: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const { from: party1, to: party2, amount: asset, memo } = transferFungibleTokenCmd.getCmdPayload();
    
    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!party1, "'party1' is required");
    assert(!!party2, "'party2' is required");
    assert(!!asset, "'asset' is required");

    super(APP_EVENT.FT_TRANSFER_PROPOSAL_DECLINED, {
      proposalId, 
      expirationTime,
      party1,
      party2,
      asset,
      memo,
      proposalCtx
    });
  }

}


module.exports = FungibleTokenTransferProposalDeclinedEvent;