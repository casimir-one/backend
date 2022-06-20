import { APP_EVENT, NFT_ITEM_METADATA_FORMAT } from '@deip/constants';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class NFTItemMetadataDraftUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id: draftId,
      formatType,
      jsonData
    } = eventPayload;

    assert(!!draftId, "'draftId' is required");
    if (formatType && formatType === NFT_ITEM_METADATA_FORMAT.JSON) {
      assert(!!jsonData, `'jsonData' is required for ${formatType} formatType`);
    }

    super(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, eventPayload);
  }

}

module.exports = NFTItemMetadataDraftUpdatedEvent;