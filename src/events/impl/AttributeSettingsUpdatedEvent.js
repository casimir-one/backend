import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';

class AttributeSettingsUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      portalId,
      attributeMappings
    } = eventPayload;

    assert(!!attributeMappings, "'attributeMappings' is required");

    super(APP_EVENT.ATTRIBUTE_SETTINGS_UPDATED, eventPayload);
  }

}

module.exports = AttributeSettingsUpdatedEvent;