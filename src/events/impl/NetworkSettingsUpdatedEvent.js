import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';

class NetworkSettingsUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      portalId,
      networkSettings 
    } = eventPayload;

    assert(!!networkSettings, "'networkSettings' is required");

    super(APP_EVENT.NETWORK_SETTINGS_UPDATED, eventPayload);
  }

}

module.exports = NetworkSettingsUpdatedEvent;