import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';
import { ASSET_TYPE } from '@deip/constants';


// TODO: Split this event to separate FungibleTokenTransfered and NonFungibleTokenTransfered
class AssetTransferedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      from,
      to,

      assetType, // tmp

      // FT
      tokenId,
      symbol,
      precision,
      amount,

      // NFT
      classId,
      instanceId
    } = eventPayload;

    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");

    if (assetType == ASSET_TYPE.NFT) {
      assert(!!classId, "NFT 'classId' is required");
      assert(!!instanceId && !isNaN(instanceId), "NFT 'instanceId' is required");
    } else {
      assert(!!tokenId, "FT 'tokenId' is required");
      assert(!!symbol, "FT 'symbol' is required");
      assert(!isNaN(precision), "FT 'precision' is required");
      assert(!!amount, "FT 'amount' is required");
    }

    super(APP_EVENT.ASSET_TRANSFERED, eventPayload);
  }

}

module.exports = AssetTransferedEvent;