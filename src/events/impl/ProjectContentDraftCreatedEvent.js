import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ProjectContentDraftCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      projectId,
      draftId,
      draftType
    } = eventPayload;

    assert(!!projectId, "'projectId' is required");
    assert(!!draftId, "'draftId' is required");
    assert(!!draftType, "'draftType' is required");

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED, eventPayload);
  }

}

module.exports = ProjectContentDraftCreatedEvent;