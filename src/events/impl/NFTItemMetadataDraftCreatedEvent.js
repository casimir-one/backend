import { APP_EVENT, NftItemMetadataDraftStatus, NFT_ITEM_METADATA_FORMAT } from '@casimir/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class NFTItemMetadataDraftCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      nftCollectionId,
      nftItemId,
      entityId,
      formatType,
      jsonData,
      status,
      owner
    } = eventPayload;

    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!entityId, "'entityId' is required");
    assert(!!nftItemId, "'nftItemId' is required");
    assert(!!formatType, "'formatType' is required");
    assert(!!owner, "'owner' is required");
    if (formatType === NFT_ITEM_METADATA_FORMAT.JSON) {
      assert(!!jsonData, `'jsonData' is required for ${formatType} formatType`);
    }
    if (status) {
      const validStatuses = [
        NftItemMetadataDraftStatus.IN_PROGRESS,
        NftItemMetadataDraftStatus.PROPOSED
      ];
      assert(validStatuses.includes(status), "'status' is invalid");
    }

    super(APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED, eventPayload);
  }

}

module.exports = NFTItemMetadataDraftCreatedEvent;