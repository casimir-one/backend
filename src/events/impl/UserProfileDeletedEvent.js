import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class UserProfileDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username
    } = eventPayload;

    assert(!!username, "'username' is required");

    super(APP_EVENT.USER_PROFILE_DELETED, eventPayload);
  }

}

module.exports = UserProfileDeletedEvent;