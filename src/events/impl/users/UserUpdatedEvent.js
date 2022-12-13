import BaseEvent from '../../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class UserUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      email,
      pubKey,
      attributes,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(Array.isArray(attributes), "'attributes' must be array");

    super(APP_EVENT.USER_UPDATED, eventPayload);
  }

}


module.exports = UserUpdatedEvent;