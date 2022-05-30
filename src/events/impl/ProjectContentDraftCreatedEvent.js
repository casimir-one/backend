import BaseEvent from './../base/BaseEvent';
import { APP_EVENT, PROJECT_CONTENT_FORMAT, PROJECT_CONTENT_DRAFT_STATUS } from '@deip/constants';
import assert from 'assert';

class ProjectContentDraftCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      projectId,
      draftId,
      formatType,
      jsonData,
      status,
    } = eventPayload;

    assert(!!projectId, "'projectId' is required");
    assert(!!draftId, "'draftId' is required");
    assert(!!formatType, "'formatType' is required");
    if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
      assert(!!jsonData, `'jsonData' is required for ${formatType} formatType`);
    }
    if (status) {
      const validStatuses = [
        PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS,
        PROJECT_CONTENT_DRAFT_STATUS.PROPOSED
      ];
      assert(validStatuses.includes(status), "'status' is invalid");
    }

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED, eventPayload);
  }

}

module.exports = ProjectContentDraftCreatedEvent;