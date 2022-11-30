import { APP_EVENT, NftItemMetadataDraftStatus } from '@casimir.one/platform-core';
import assert from 'assert';
import BaseEvent from '../../base/BaseEvent';

class NFTItemCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      nftCollectionId,
      status,
      ownerId,
      creatorId
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    // assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!ownerId, "'ownerId' is required");
    assert(!!creatorId, "'creatorId' is required");
    
    if (status) {
      const validStatuses = [
        NftItemMetadataDraftStatus.PROPOSED
      ];
      assert(validStatuses.includes(status), "'status' is invalid");
    }

    super(APP_EVENT.NFT_ITEM_CREATED, eventPayload);
  }

}

module.exports = NFTItemCreatedEvent;