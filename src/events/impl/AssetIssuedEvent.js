import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class AssetIssuedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      issuer,
      asset,
      recipient
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(
      !!asset
      && asset.id
      && asset.symbol
      && !isNaN(asset.precision)
      && asset.amount,
      "'asset' is required and should contains 'id', 'symbol', 'precision', 'amount' fields"
    );
    assert(!!recipient, "'recipient' is required");

    super(APP_EVENT.ASSET_ISSUED, eventPayload);
  }

}

module.exports = AssetIssuedEvent;