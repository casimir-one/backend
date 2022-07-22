import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class NFTItemMetadataCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      nftCollectionId,
      owner,
      nftItemMetadataDraftId,
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!owner, "'owner' is required");
    assert(!!nftItemMetadataDraftId, "'nftItemMetadataDraftId' is required");

    super(APP_EVENT.NFT_ITEM_METADATA_CREATED, eventPayload);
  }

}

module.exports = NFTItemMetadataCreatedEvent;