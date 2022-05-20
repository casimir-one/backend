import { APP_EVENT } from '@deip/constants';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class ProjectContentMetadataUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      metadata,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!metadata, "'metadata' is required");

    super(APP_EVENT.PROJECT_CONTENT_METADATA_UPDATED, eventPayload);
  }

}

module.exports = ProjectContentMetadataUpdatedEvent;