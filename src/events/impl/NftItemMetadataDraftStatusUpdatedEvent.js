import BaseEvent from '../base/BaseEvent';
import { APP_EVENT, PROJECT_CONTENT_DRAFT_STATUS } from '@deip/constants';
import assert from 'assert';

class NftItemMetadataDraftStatusUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      status,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!status, "'status' is required");
    assert(!!PROJECT_CONTENT_DRAFT_STATUS[status], "'status' is invalid");

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_STATUS_UPDATED, eventPayload);
  }

}

module.exports = NftItemMetadataDraftStatusUpdatedEvent;