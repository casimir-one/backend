import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class AttributeUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      attribute: {
        _id: attributeId,
        title
      }
    } = eventPayload;

    assert(!!attributeId, "'attributeId' is required");
    assert(!!title, "'title' is required");

    super(APP_EVENT.ATTRIBUTE_UPDATED, eventPayload);
  }

}

module.exports = AttributeUpdatedEvent;