import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class NFTCollectionCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      issuer,
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!entityId, "'entityId' is required");

    super(APP_EVENT.NFT_COLLECTION_CREATED, eventPayload);
  }

}

module.exports = NFTCollectionCreatedEvent;