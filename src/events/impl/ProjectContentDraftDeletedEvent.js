import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ProjectContentDraftDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      draftId
    } = eventPayload;

    assert(!!draftId, "'draftId' is required");

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_DELETED, eventPayload);
  }

}

module.exports = ProjectContentDraftDeletedEvent;