import BaseEvent from './../base/BaseEvent';
import { APP_PROPOSAL } from '@deip/constants';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class AssetExchangeProposalDeclinedEvent extends BaseEvent {
  constructor(eventPayload) {
    const {
      proposalCmd,
      proposalCtx
    } = eventPayload;

    assert(!!proposalCmd, `'proposalCmd' is required`);
    assert(APP_PROPOSAL.ASSET_EXCHANGE_PROPOSAL == proposalCmd.getProposalType(), `This event must be generated out of ${APP_PROPOSAL.ASSET_EXCHANGE_PROPOSAL} proposal`);
    
    const proposedCmds = proposalCmd.getProposedCmds();
    const assetExchangeCmd1 = proposedCmds[0];
    const assetExchangeCmd2 = proposedCmds[1];
    const { entityId: proposalId, expirationTime, creator } = proposalCmd.getCmdPayload();
    const { from: party1, to: party2, asset: asset1, memo } = assetExchangeCmd1.getCmdPayload();
    const { asset: asset2 } = assetExchangeCmd2.getCmdPayload();
    
    assert(!!proposalId, `'proposalId' is required`);
    assert(!!expirationTime, `'expirationTime' is required`);
    assert(!!party1, "'party1' is required");
    assert(!!party2, "'party2' is required");
    assert(
      !!asset1
      && asset1.id
      && asset1.symbol
      && !isNaN(asset1.precision)
      && asset1.amount,
      "'asset1' is required and should contains 'id', 'symbol', 'precision', 'amount' fields"
    )
    assert(
      !!asset2
      && asset2.id
      && asset2.symbol
      && !isNaN(asset2.precision)
      && asset2.amount,
      "'asset2' is required and should contains 'id', 'symbol', 'precision', 'amount' fields"
    )

    super(APP_EVENT.ASSET_EXCHANGE_PROPOSAL_DECLINED, {
      proposalId, 
      expirationTime,
      party1,
      party2,
      asset1,
      asset2,
      memo,
      proposalCtx
    });
  }

}


module.exports = AssetExchangeProposalDeclinedEvent;