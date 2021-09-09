import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ProjectContentCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      projectId,
      teamId,
      content,
      type,
      authors,
      title
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    assert(!!projectId, "'projectId' is required");
    assert(!!teamId, "'teamId' is required");
    assert(!!content, "'content' is required");
    assert(!!type, "'type' is required");
    assert(!!authors && authors.length, "'authors' is required");
    assert(!!title, "'title' is required");

    super(APP_EVENT.PROJECT_CONTENT_CREATED, eventPayload);
  }

}

module.exports = ProjectContentCreatedEvent;