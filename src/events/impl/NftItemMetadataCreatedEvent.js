import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class NftItemMetadataCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      nftCollectionId,
      owner,
      issuer,
      nftItemMetadataDraftId,
      contentType,
      authors,
      title,
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    assert(!!nftCollectionId, "'nftCollectionId' is required");
    assert(!!owner, "'owner' is required");
    assert(!!issuer, "'issuer' is required");
    assert(!!nftItemMetadataDraftId, "'nftItemMetadataDraftId' is required");

    super(APP_EVENT.NFT_ITEM_METADATA_CREATED, eventPayload);
  }

}

module.exports = NftItemMetadataCreatedEvent;