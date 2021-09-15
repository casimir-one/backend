import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ProjectNdaCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId: projectNdaId,
      creator,
      parties,
      description,
      projectId,
      startTime,
      endTime
    } = eventPayload;

    assert(!!projectNdaId, "'projectNdaId' is required");
    assert(!!creator, "'creator' is required");
    assert(!!parties && Array.isArray(parties) && parties.length > 0, "'parties' is required");
    assert(!!projectId, "'projectId' is required");
    assert(!!description, "'description' is required");
    assert(!!endTime, "'endTime' is required");

    super(APP_EVENT.PROJECT_NDA_CREATED, eventPayload);
  }

}

module.exports = ProjectNdaCreatedEvent;