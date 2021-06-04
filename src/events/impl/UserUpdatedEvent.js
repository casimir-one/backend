import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';


class UserUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username,
      attributes,
      email,
      status
    } = eventPayload;

    assert(!!username, "'username' is required");
    assert(!!attributes && attributes.length, "'attributes' required");
    assert(!!email, "'email' required");
    assert(!!status, "'status' required");

    super(APP_EVENT.USER_UPDATED, eventPayload);
  }

}


module.exports = UserUpdatedEvent;