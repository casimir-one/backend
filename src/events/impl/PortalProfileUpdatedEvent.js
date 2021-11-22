import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class PortalProfileUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      settings
    } = eventPayload;

    assert(!!settings, "'settings' is required");

    super(APP_EVENT.PORTAL_PROFILE_UPDATED, eventPayload);
  }

}

module.exports = PortalProfileUpdatedEvent;