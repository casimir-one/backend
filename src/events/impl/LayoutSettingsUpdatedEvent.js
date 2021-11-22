import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class LayoutSettingsUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      portalId,
      layoutSettings
    } = eventPayload;

    assert(!!layoutSettings, "'layoutSettings' is required");

    super(APP_EVENT.LAYOUT_SETTINGS_UPDATED, eventPayload);
  }

}

module.exports = LayoutSettingsUpdatedEvent;