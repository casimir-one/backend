import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';

class LayoutUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id: layoutId,
      name,
      value
    } = eventPayload;

    assert(!!layoutId, "'layoutId' is required");
    assert(!!name, "'name' is required");
    assert(!!value && Array.isArray(value), "'value' is required and should be aray");

    super(APP_EVENT.LAYOUT_UPDATED, eventPayload);
  }

}

module.exports = LayoutUpdatedEvent;