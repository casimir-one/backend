import BaseEvent from '../../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class NFTCollectionCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      ownerId,
      attributes
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!ownerId, "'ownerId' is required");
    assert(Array.isArray(attributes), "'attributes' must be array");

    super(APP_EVENT.NFT_COLLECTION_CREATED, eventPayload);
  }

}

module.exports = NFTCollectionCreatedEvent;