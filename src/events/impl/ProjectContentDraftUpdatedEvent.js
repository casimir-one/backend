import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';
import { PROJECT_CONTENT_FORMAT } from '@deip/constants';

class ProjectContentDraftUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id: draftId,
      formatType,
      jsonData
    } = eventPayload;

    assert(!!draftId, "'draftId' is required");
    if (formatType && formatType === PROJECT_CONTENT_FORMAT.JSON) {
      assert(!!jsonData, `'jsonData' is required for ${formatType} formatType`);
    }

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED, eventPayload);
  }

}

module.exports = ProjectContentDraftUpdatedEvent;