import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class FTTransferredEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      from,
      to,
      tokenId,
      amount
    } = eventPayload;

    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");
    assert(tokenId !== undefined, "FT 'tokenId' is required");
    assert(!!amount, "FT 'amount' is required");

    super(APP_EVENT.FT_TRANSFERRED, eventPayload);
  }

}

module.exports = FTTransferredEvent;