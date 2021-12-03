import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class BookmarkDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username,
      bookmarkId
    } = eventPayload;

    assert(!!username, "'username' is required");
    assert(!!bookmarkId, "'bookmarkId' is required");

    super(APP_EVENT.BOOKMARK_DELETED, eventPayload);
  }

}

module.exports = BookmarkDeletedEvent;