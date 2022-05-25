import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';


class NftCollectionMetadataCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      nftCollectionId,
      issuer,
      attributes,
      isDefault
    } = eventPayload;

    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!issuer, "'issuer' is required");

    super(APP_EVENT.NFT_COLLECTION_METADATA_CREATED, eventPayload);
  }

}


module.exports = NftCollectionMetadataCreatedEvent;