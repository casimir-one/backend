import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';


class NFTCollectionMetadataCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      issuer,
      attributes
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    assert(!!issuer, "'issuer' is required");

    super(APP_EVENT.NFT_COLLECTION_METADATA_CREATED, eventPayload);
  }

}


module.exports = NFTCollectionMetadataCreatedEvent;