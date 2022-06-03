import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class ProjectContentDraftModerationMessageUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      moderationMessage,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!moderationMessage, "'moderationMessage' is required");

    super(APP_EVENT.PROJECT_CONTENT_DRAFT_MODERATION_MESSAGE_UPDATED, eventPayload);
  }

}

module.exports = ProjectContentDraftModerationMessageUpdatedEvent;