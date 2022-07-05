import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class NFTItemMetadataDraftModerationMsgUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      moderationMessage,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!moderationMessage, "'moderationMessage' is required");

    super(APP_EVENT.NFT_ITEM_METADATA_DRAFT_MODERATION_MSG_UPDATED, eventPayload);
  }

}

module.exports = NFTItemMetadataDraftModerationMsgUpdatedEvent;