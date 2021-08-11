import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class DocumentTemplateUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id: documentTemplateId,
      body,
      title
    } = eventPayload;

    assert(!!documentTemplateId, "'documentTemplateId' is required");
    assert(!!body, "'body' is required");

    super(APP_EVENT.DOCUMENT_TEMPLATE_UPDATED, eventPayload);
  }

}

module.exports = DocumentTemplateUpdatedEvent;