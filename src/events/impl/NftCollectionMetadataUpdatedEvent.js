import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';


class NftCollectionMetadataUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      attributes
    } = eventPayload;

    assert(!!_id, "'_id' is required");

    super(APP_EVENT.NFT_COLLECTION_METADATA_UPDATED, eventPayload);
  }

}


module.exports = NftCollectionMetadataUpdatedEvent;