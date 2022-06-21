import { APP_EVENT } from '@deip/constants';
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