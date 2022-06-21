import { APP_EVENT } from '@deip/constants';
import assert from 'assert';
import BaseEvent from "../base/BaseEvent";

class NFTItemMetadataDraftDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id
    } = eventPayload;

    assert(!!_id, "'_id' is required");

    super(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, eventPayload);
  }

}

module.exports = NFTItemMetadataDraftDeletedEvent;