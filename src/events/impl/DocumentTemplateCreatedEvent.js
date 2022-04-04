import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class DocumentTemplateCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      account,
      body,
      creator,
      title
    } = eventPayload;

    assert(!!account, "'account' is required");
    assert(!!body, "'body' is required");
    assert(!!creator, "'creator' is required");

    super(APP_EVENT.DOCUMENT_TEMPLATE_CREATED, eventPayload);
  }

}

module.exports = DocumentTemplateCreatedEvent;