import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';


class NFTCollectionMetadataUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      attributes
    } = eventPayload;

    assert(!!_id, "'_id' is required");

    super(APP_EVENT.NFT_COLLECTION_METADATA_UPDATED, eventPayload);
  }

}


module.exports = NFTCollectionMetadataUpdatedEvent;