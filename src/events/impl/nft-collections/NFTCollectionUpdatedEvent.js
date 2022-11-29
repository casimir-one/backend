import BaseEvent from '../../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class NFTCollectionUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      attributes
    } = eventPayload;

    assert(!!_id, "'_id' is required");

    super(APP_EVENT.NFT_COLLECTION_UPDATED, eventPayload);
  }

}


module.exports = NFTCollectionUpdatedEvent;