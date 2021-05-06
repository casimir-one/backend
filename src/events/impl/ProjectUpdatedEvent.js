import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      projectId,
      teamId,
      attributes
    } = eventPayload;

    assert(!!projectId, "'projectId' is required");
    assert(!!teamId, "'teamId' is required");
    assert(!!attributes && attributes.length, "'attributes' required");

    super(APP_EVENT.PROJECT_UPDATED, eventPayload);
  }

}


module.exports = ProjectUpdatedEvent;