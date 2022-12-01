import { APP_EVENT, APP_PROPOSAL } from '@casimir.one/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';


class NFTTransferProposalDeclinedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL} proposal`);

    const proposedCmds = proposalCmd.getProposedCmds();
    const transferNFTCmd = proposedCmds[0];
    const { _id: proposalId, expirationTime } = proposalCmd.getCmdPayload();
    const { from: party1, to: party2, amount: asset, memo } = transferNFTCmd.getCmdPayload();

    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!party1, "'party1' is required");
    assert(!!party2, "'party2' is required");
    assert(!!asset, "'asset' is required");

    super(APP_EVENT.NFT_TRANSFER_PROPOSAL_DECLINED, {
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


module.exports = NFTTransferProposalDeclinedEvent;