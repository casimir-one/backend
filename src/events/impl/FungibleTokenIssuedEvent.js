import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class FungibleTokenIssuedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      issuer,
      tokenId,
      symbol,
      precision,
      amount,
      recipient
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!tokenId, "FT 'tokenId' is required");
    assert(!!symbol, "FT 'symbol' is required");
    assert(!isNaN(precision), "FT 'precision' is required");
    assert(!!amount, "FT 'amount' is required");
    assert(!!recipient, "'recipient' is required");

    super(APP_EVENT.FT_ISSUED, eventPayload);
  }

}

module.exports = FungibleTokenIssuedEvent;