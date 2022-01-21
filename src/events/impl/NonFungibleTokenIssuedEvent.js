import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class NonFungibleTokenIssuedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      issuer,
      classId,
      instanceId,
      recipient
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!classId, "'classId' is required");
    assert(!!instanceId && !isNaN(instanceId), "'instanceId' is required");
    assert(!!recipient, "'recipient' is required");

    super(APP_EVENT.NFT_ISSUED, eventPayload);
  }

}

module.exports = NonFungibleTokenIssuedEvent;