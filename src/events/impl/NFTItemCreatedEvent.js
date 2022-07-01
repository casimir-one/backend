import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class NFTItemCreatedEvent extends BaseEvent {

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

module.exports = NFTItemCreatedEvent;