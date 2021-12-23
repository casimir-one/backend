import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class UserCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username,
      status,
      pubKey,
      portalId,
      email,
      attributes,
      roles
    } = eventPayload;

    assert(!!username, "'username' is required");
    assert(!!attributes, "'attributes' required");
    assert(!!email, "'email' required");
    assert(!!status, "'status' required");
    assert(!!pubKey, "'pubKey' required");
    assert(Array.isArray(roles), "'roles' should be array");

    super(APP_EVENT.USER_CREATED, eventPayload);
  }

}


module.exports = UserCreatedEvent;