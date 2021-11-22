import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class AttributeSettingsUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      portalId,
      attributeSettings
    } = eventPayload;

    assert(!!attributeSettings, "'attributeSettings' is required");

    super(APP_EVENT.ATTRIBUTE_SETTINGS_UPDATED, eventPayload);
  }

}

module.exports = AttributeSettingsUpdatedEvent;