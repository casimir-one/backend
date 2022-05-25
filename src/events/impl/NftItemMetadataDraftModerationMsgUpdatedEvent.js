import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class NftItemMetadataDraftModerationMsgUpdatedEvent extends BaseEvent {

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

module.exports = NftItemMetadataDraftModerationMsgUpdatedEvent;