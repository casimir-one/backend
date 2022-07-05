import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';


class NFTTransferredEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      from,
      to,
      nftCollectionId,
      nftItemId
    } = eventPayload;

    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");
    assert(!!nftCollectionId, "NFT 'nftCollectionId' is required");
    assert(!!nftItemId && !isNaN(nftItemId), "NFT 'nftItemId' is required");

    super(APP_EVENT.NFT_TRANSFERRED, eventPayload);
  }

}

module.exports = NFTTransferredEvent;