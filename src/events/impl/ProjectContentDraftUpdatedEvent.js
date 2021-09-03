import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ProjectContentDraftUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id: draftId
    } = eventPayload;

    assert(!!draftId, "'draftId' is required");

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED, eventPayload);
  }

}

module.exports = ProjectContentDraftUpdatedEvent;