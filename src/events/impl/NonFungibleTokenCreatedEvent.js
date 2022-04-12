import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class NonFungibleTokenCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      issuer,
      name,
      description,
      metadata
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");

    if (metadata) { // keep this until we have working F-NFT
      const { projectId } = metadata;
      assert(!!projectId, "'projectId' is required for project token");
    }

    super(APP_EVENT.NFT_CREATED, eventPayload);
  }

}

module.exports = NonFungibleTokenCreatedEvent;