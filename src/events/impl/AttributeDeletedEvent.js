import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class AttributeDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      attributeId
    } = eventPayload;

    assert(!!attributeId, "'attributeId' is required");

    super(APP_EVENT.ATTRIBUTE_DELETED, eventPayload);
  }

}

module.exports = AttributeDeletedEvent;