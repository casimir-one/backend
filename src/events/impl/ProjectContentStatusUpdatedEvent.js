import { APP_EVENT } from '@deip/constants';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';

class ProjectContentStatusUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      status,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!status, "'status' is required");

    super(APP_EVENT.PROJECT_CONTENT_STATUS_UPDATED, eventPayload);
  }

}

module.exports = ProjectContentStatusUpdatedEvent;