import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class FungibleTokenIssuedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      issuer,
      tokenId,
      amount,
      recipient
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!tokenId, "FT 'tokenId' is required");
    assert(!!amount, "FT 'amount' is required");
    assert(!!recipient, "'recipient' is required");

    super(APP_EVENT.FT_ISSUED, eventPayload);
  }

}

module.exports = FungibleTokenIssuedEvent;