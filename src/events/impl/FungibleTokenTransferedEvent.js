import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';


class FungibleTokenTransferedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      from,
      to,
      tokenId,
      amount
    } = eventPayload;

    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");
    assert(!!tokenId, "FT 'tokenId' is required");
    assert(!!amount, "FT 'amount' is required");

    super(APP_EVENT.FT_TRANSFERED, eventPayload);
  }

}

module.exports = FungibleTokenTransferedEvent;