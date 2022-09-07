import { APP_EVENT, NFT_ITEM_METADATA_FORMAT } from '@casimir.one/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class NFTItemMetadataDraftUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id: draftId,
    } = eventPayload;

    assert(!!draftId, "'draftId' is required");

    super(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, eventPayload);
  }

}

module.exports = NFTItemMetadataDraftUpdatedEvent;