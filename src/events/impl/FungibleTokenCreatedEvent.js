import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class FungibleTokenCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      issuer,
      symbol,
      precision,
      maxSupply,
      description,
      metadata
    } = eventPayload;

    assert(!!issuer, "'issuer' is required");
    assert(!!symbol, "'symbol' is required");
    assert(Number.isInteger(precision) && precision >= 0, "'precision' must be a positive number");
    assert(!!maxSupply, "'maxSupply' is required");

    if (metadata) { // keep this until we have working F-NFT
      const { projectId, teamId } = metadata;
      assert(!!projectId, "'projectId' is required for project token");
      assert(!!teamId, "'teamId' is required for project token");
    }

    super(APP_EVENT.FT_CREATED, eventPayload);
  }

}

module.exports = FungibleTokenCreatedEvent;