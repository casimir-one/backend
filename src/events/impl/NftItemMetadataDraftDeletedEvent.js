import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class NftItemMetadataDraftDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id
    } = eventPayload;

    assert(!!_id, "'_id' is required");

    super(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, eventPayload);
  }

}

module.exports = NftItemMetadataDraftDeletedEvent;