import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';
import BaseEvent from './../base/BaseEvent';

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