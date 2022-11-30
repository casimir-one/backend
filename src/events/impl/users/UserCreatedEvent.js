import BaseEvent from '../../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class UserCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId,
      pubKey,
      email,
      status,
      attributes,
      roles
    } = eventPayload;

    assert(!!entityId, "'entityId' is required");
    assert(!!pubKey, "'pubKey' is required");
    assert(!!email, "'email' is required");
    assert(!!status, "'status' is required");
    assert(Array.isArray(attributes), "'attributes' must be array");
    assert(Array.isArray(roles), "'roles' must be array");

    super(APP_EVENT.USER_CREATED, eventPayload);
  }

}


module.exports = UserCreatedEvent;