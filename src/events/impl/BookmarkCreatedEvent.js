import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class BookmarkCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username,
      ref,
      type
    } = eventPayload;

    assert(!!username, "'username' is required");
    assert(!!ref, "'ref' is required");
    assert(!!type, "'type' is required");

    super(APP_EVENT.BOOKMARK_CREATED, eventPayload);
  }

}

module.exports = BookmarkCreatedEvent;