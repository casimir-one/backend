import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';

class PortalSettingsUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      title,
      banner,
      logo
    } = eventPayload;

    assert(!!title || !!banner || !!logo, "at least one of 'title', 'banner', 'logo' is required");

    super(APP_EVENT.PORTAL_SETTINGS_UPDATED, eventPayload);
  }

}

module.exports = PortalSettingsUpdatedEvent;