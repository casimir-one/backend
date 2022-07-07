import BaseEvent from './../base/BaseEvent';
import assert from 'assert';
import { AttributeScope, APP_EVENT } from '@casimir/platform-core';

class LayoutCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      name,
      value,
      scope,
      type
    } = eventPayload;

    assert(!!name, "'name' is required");
    assert(!!value && Array.isArray(value), "'value' is required and should be aray");
    assert(!!scope && Object.values(AttributeScope).includes(scope), "'scope' is required and should be from 'AttributeScope'");
    assert(!!type, "'type' is required");

    super(APP_EVENT.LAYOUT_CREATED, eventPayload);
  }

}

module.exports = LayoutCreatedEvent;