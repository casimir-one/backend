import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class AssetTransferedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      from,
      to,
      amount,
      memo
    } = eventPayload;

    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");
    assert(!!amount, "'amount' is required");

    super(APP_EVENT.ASSET_TRANSFERED, eventPayload);
  }

}

module.exports = AssetTransferedEvent;