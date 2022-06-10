import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class NftItemIssuedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      issuer,
      nftCollectionId,
      nftItemId,
      recipient
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!nftItemId && !isNaN(nftItemId), "'nftItemId' is required");
    assert(!!recipient, "'recipient' is required");

    super(APP_EVENT.NFT_ITEM_CREATED, eventPayload);
  }

}

module.exports = NftItemIssuedEvent;