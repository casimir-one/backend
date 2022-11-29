import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';
import BaseEvent from '../../base/BaseEvent';

class NFTItemUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
    } = eventPayload;

    assert(!!_id, "'_id' is required");

    super(APP_EVENT.NFT_ITEM_UPDATED, eventPayload);
  }

}

module.exports = NFTItemUpdatedEvent;