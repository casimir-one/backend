import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class AssetTransferedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      from,
      to,
      asset,
      memo
    } = eventPayload;

    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");
    assert(
      !!asset
      && asset.id
      && asset.symbol
      && !isNaN(asset.precision)
      && asset.amount,
      "'asset' is required and should contains 'id', 'symbol', 'precision', 'amount' fields"
    )

    super(APP_EVENT.ASSET_TRANSFERED, eventPayload);
  }

}

module.exports = AssetTransferedEvent;