import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class LayoutUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      portalId,
      ...layout
    } = eventPayload;

    assert(!!layout, "'layout' is required");

    super(APP_EVENT.LAYOUT_UPDATED, eventPayload);
  }

}

module.exports = LayoutUpdatedEvent;