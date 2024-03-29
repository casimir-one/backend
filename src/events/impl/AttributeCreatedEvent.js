import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';

class AttributeCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      attribute: {
        title
      }
    } = eventPayload;

    assert(!!title, "'title' is required");

    super(APP_EVENT.ATTRIBUTE_CREATED, eventPayload);
  }

}

module.exports = AttributeCreatedEvent;