import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';

class LayoutSettingsUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      portalId,
      layoutMappings
    } = eventPayload;

    assert(!!layoutMappings, "'layoutMappings' is required");

    super(APP_EVENT.LAYOUT_SETTINGS_UPDATED, eventPayload);
  }

}

module.exports = LayoutSettingsUpdatedEvent;