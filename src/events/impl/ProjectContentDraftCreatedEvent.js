import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';
import { PROJECT_CONTENT_FORMAT } from '@deip/constants';

class ProjectContentDraftCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      projectId,
      draftId,
      formatType,
      jsonData
    } = eventPayload;

    assert(!!projectId, "'projectId' is required");
    assert(!!draftId, "'draftId' is required");
    assert(!!formatType, "'formatType' is required");
    if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
      assert(!!jsonData, `'jsonData' is required for ${formatType} formatType`);
    }

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED, eventPayload);
  }

}

module.exports = ProjectContentDraftCreatedEvent;