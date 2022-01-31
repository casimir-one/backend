import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';
import { ATTR_SCOPES } from '@deip/constants';

class LayoutCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      name,
      value,
      scope,
      type
    } = eventPayload;

    assert(!!name, "'name' is required");
    assert(!!value && Array.isArray(value), "'value' is required and should be aray");
    assert(!!scope && ATTR_SCOPES.includes(scope), "'scope' is required and should be from 'ATTR_SCOPES'");
    assert(!!type, "'type' is required");

    super(APP_EVENT.LAYOUT_CREATED, eventPayload);
  }

}

module.exports = LayoutCreatedEvent;