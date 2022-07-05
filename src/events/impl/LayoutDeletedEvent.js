import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';

class LayoutDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      layoutId,
    } = eventPayload;

    assert(!!layoutId, "'layoutId' is required");

    super(APP_EVENT.LAYOUT_DELETED, eventPayload);
  }

}

module.exports = LayoutDeletedEvent;