import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class ProjectContentCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      projectId,
      teamId,
      content,
      contentType,
      authors,
      title
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    assert(!!projectId, "'projectId' is required");
    assert(!!teamId, "'teamId' is required");
    assert(!!content, "'content' is required");
    assert(!!contentType, "'contentType' is required");
    assert(!!authors && authors.length, "'authors' is required");
    assert(!!title, "'title' is required");

    super(APP_EVENT.PROJECT_CONTENT_CREATED, eventPayload);
  }

}

module.exports = ProjectContentCreatedEvent;