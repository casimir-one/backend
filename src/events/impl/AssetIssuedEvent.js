import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class AttributeCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      assetId,
      issuer,
      amount,
      recipient
    } = eventPayload;

    assert(!!assetId, "'assetId' is required");
    assert(!!issuer, "'issuer' is required");
    assert(!!amount, "'amount' is required");
    assert(!!recipient, "'recipient' is required");

    super(APP_EVENT.ASSET_ISSUED, eventPayload);
  }

}

module.exports = AttributeCreatedEvent;