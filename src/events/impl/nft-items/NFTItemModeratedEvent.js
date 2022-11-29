import { APP_EVENT, NftItemMetadataDraftStatus } from '@casimir.one/platform-core';
import assert from 'assert';
import BaseEvent from '../../base/BaseEvent';

class NFTItemModeratedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      status,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!status, "'status' is required");
    assert(Object.values(NftItemMetadataDraftStatus).includes(status), "'status' is invalid");

    super(APP_EVENT.NFT_ITEM_MODERATED, eventPayload);
  }

}

module.exports = NFTItemModeratedEvent;