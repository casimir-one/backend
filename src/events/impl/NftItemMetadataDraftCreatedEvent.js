import BaseEvent from './../base/BaseEvent';
import { APP_EVENT, PROJECT_CONTENT_FORMAT, PROJECT_CONTENT_DRAFT_STATUS } from '@deip/constants';
import assert from 'assert';

class NftItemMetadataDraftCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      nftCollectionId,
      entityId,
      formatType,
      jsonData,
      status,
      owner
    } = eventPayload;

    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!entityId, "'entityId' is required");
    assert(!!formatType, "'formatType' is required");
    assert(!!owner, "'owner' is required");
    if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
      assert(!!jsonData, `'jsonData' is required for ${formatType} formatType`);
    }
    if (status) {
      const validStatuses = [
        PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS,
        PROJECT_CONTENT_DRAFT_STATUS.PROPOSED
      ];
      assert(validStatuses.includes(status), "'status' is invalid");
    }

    super(APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED, eventPayload);
  }

}

module.exports = NftItemMetadataDraftCreatedEvent;