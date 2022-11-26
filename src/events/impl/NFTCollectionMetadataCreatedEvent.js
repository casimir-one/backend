import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class NFTCollectionMetadataCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      ownerId,
      attributes
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    assert(!!ownerId, "'ownerId' is required");

    super(APP_EVENT.NFT_COLLECTION_METADATA_CREATED, eventPayload);
  }

}


module.exports = NFTCollectionMetadataCreatedEvent;