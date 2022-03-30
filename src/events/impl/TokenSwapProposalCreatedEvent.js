import BaseEvent from '../base/BaseEvent';
import { APP_PROPOSAL, APP_CMD } from '@deip/constants';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';


class TokenSwapProposalCreatedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.TOKENS_SWAP_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.TOKENS_SWAP_PROPOSAL} proposal`);
    
    const proposedCmds = proposalCmd.getProposedCmds();
    const tokenSwapCmd1 = proposedCmds[0];
    const tokenSwapCmd2 = proposedCmds[1];
    const { entityId: proposalId, expirationTime, creator } = proposalCmd.getCmdPayload();
    const { from: party1, to: party2, memo, ...token1 } = tokenSwapCmd1.getCmdPayload();
    const { ...token2 } = tokenSwapCmd2.getCmdPayload();
    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!party1, "'party1' is required");
    assert(!!party2, "'party2' is required");

    if (tokenSwapCmd1.getCmdNum() === APP_CMD.TRANSFER_NFT) {
      assert(
        !!token1
        && token1.classId
        && token1.instanceId
        && !isNaN(token1.instanceId),
        "'token1' is required and should contains 'classId', 'instanceId' fields"
      )
    } else {
      assert(
        !!token1
        && token1.tokenId
        && token1.amount,
        "'token1' is required and should contains 'tokenId', 'amount' fields"
      )
    }

    if (tokenSwapCmd2.getCmdNum() === APP_CMD.TRANSFER_NFT) {
      assert(
        !!token2
        && token2.classId
        && token2.instanceId
        && !isNaN(token2.instanceId),
        "'token2' is required and should contains 'classId', 'instanceId' fields"
      )
    } else {
      assert(
        !!token2
        && token2.tokenId
        && token2.amount,
        "'token2' is required and should contains 'tokenId', 'amount' fields"
      )
    }

    super(APP_EVENT.TOKENS_SWAP_PROPOSAL_CREATED, {
      proposalId, 
      expirationTime,
      party1,
      party2,
      token1,
      token2,
      memo,
      proposalCtx
    });
  }

}


module.exports = TokenSwapProposalCreatedEvent;