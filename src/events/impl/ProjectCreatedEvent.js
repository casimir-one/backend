import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      projectId,
      teamId,
      attributes,
      status
    } = eventPayload;

    assert(!!projectId, "'projectId' is required");
    assert(!!teamId, "'teamId' is required");
    assert(!!status, "'status' is required");
    assert(!!attributes && attributes.length, "'attributes' required");

    super(APP_EVENT.PROJECT_CREATED, eventPayload);
  }

}


module.exports = ProjectCreatedEvent;